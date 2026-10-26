import {
  Plugin,
  Notice,
  TFile,
  MarkdownView,
  Editor,
  Modal,
  Setting,
  PluginSettingTab,
  Menu,
  type SettingDefinitionGroup,
  type SettingDefinitionRender,
} from "obsidian";
import { defaults, Settings } from "./settings";
import { DuplicateIndex } from "./duplicates/DuplicateIndex";
import { readStoredData } from "./storage";
import { isImage, parseImages, resizedEmbed } from "./sizing/ImageEmbedParser";
import { normalizeImages } from "./sizing/ImageSizeNormalizer";
import { imageFiles } from "./paste/ClipboardImageReader";
import { MultiImagePasteHandler } from "./paste/MultiImagePasteHandler";
import { htmlImagePaste } from "./paste/HtmlImagePaste";
import { copyMarkdown } from "./clipboard/HtmlClipboard";
import { imageMime, toDataURL, writeImage } from "./clipboard/ClipboardWriter";
import { EmbedContext, ImageEditorView } from "./editor/ImageEditorView";
import { askText } from "./ui";

export default class VisualKit extends Plugin {
  settings: Settings = { ...defaults };
  index!: DuplicateIndex;
  private paste!: MultiImagePasteHandler;
  private ribbon?: HTMLElement;
  private saveQueue: Promise<void> = Promise.resolve();
  async onload() {
    const stored = readStoredData(await this.loadData());
    this.settings = stored.settings;
    this.index = new DuplicateIndex(this.app);
    if (this.settings.persistIndex)
      for (const e of stored.index)
        if (e.path && e.hash) this.index.entries.set(e.path, e);
    this.paste = new MultiImagePasteHandler(this);
    this.addSettingTab(new SettingsTab(this));
    this.updateRibbon();
    const guarded = (action: () => Promise<unknown>) => {
      void action().catch((error) => new Notice(String(error), 10000));
    };
    this.addCommand({
      id: "copy-with-images",
      name: "Copy with images",
      editorCallback: (editor, info) =>
        guarded(() => this.copy(editor, info.file?.path || "")),
    });
    this.addCommand({
      id: "normalize-image-sizes",
      name: "Normalize image sizes",
      editorCallback: (editor) => this.normalizeModal(editor),
    });
    this.addCommand({
      id: "normalize-default-width",
      name: "Normalize images using default width",
      editorCallback: (editor) =>
        this.normalize(editor, this.settings.width, !!editor.getSelection()),
    });
    this.addCommand({
      id: "annotate-image",
      name: "Annotate image",
      editorCallback: (editor, info) => {
        if (info.file) this.annotateAtCursor(editor, info.file);
      },
    });
    this.addCommand({
      id: "rebuild-image-duplicate-index",
      name: "Rebuild image duplicate index",
      callback: () =>
        guarded(async () => {
          const notice = new Notice("Rebuilding image duplicate index…", 0);
          try {
            await this.index.rebuild((n, total) =>
              notice.setMessage(`Indexing images: ${n}/${total}`),
            );
            await this.persist();
            new Notice("Image duplicate index rebuilt");
          } finally {
            notice.hide();
          }
        }),
    });
    this.registerEvent(
      this.app.workspace.on("editor-paste", (event, editor, info) => {
        if (event.defaultPrevented || !this.settings.multiPaste || !info.file)
          return;
        const files = imageFiles(event.clipboardData);
        try {
          const rich = htmlImagePaste(
            event.clipboardData?.getData("text/html") || "",
            files,
          );
          if (rich) {
            event.preventDefault();
            this.paste.paste(rich.images, editor, info.file, rich.render);
            return;
          }
        } catch {
          new Notice(
            "Could not read pasted HTML. Falling back to standard paste.",
          );
        }
        if (!files.length) return;
        event.preventDefault();
        this.paste.paste(files, editor, info.file);
      }),
    );
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFile && isImage(file.path))
          this.imageMenu(menu, file);
      }),
    );
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, info) => {
        if (!info.file) return;
        const notePath = info.file.path;
        const context = this.contextAt(editor, info.file);
        if (context) {
          const file = this.resolve(context.embed.target, info.file.path);
          if (file) {
            this.imageMenu(menu, file, context);
            return;
          }
        }
        menu.addItem((item) =>
          item
            .setTitle("Copy with images")
            .setIcon("copy")
            .onClick(() => guarded(() => this.copy(editor, notePath))),
        );
        menu.addItem((item) =>
          item
            .setTitle("Normalize note images")
            .setIcon("scaling")
            .onClick(() => this.normalizeModal(editor)),
        );
      }),
    );
    const attach = (doc: Document) => {
      this.registerDomEvent(doc, "copy", (event) => {
        if (event.defaultPrevented || this.settings.copyMode === "dedicated")
          return;
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (
          !view?.file ||
          !view.contentEl.contains(event.target as Node) ||
          (event.target as HTMLElement).closest?.(".modal")
        )
          return;
        const selected = view.editor.getSelection();
        if (
          !selected ||
          (this.settings.copyMode === "smart" && !parseImages(selected).length)
        )
          return;
        event.preventDefault();
        guarded(() => this.copy(view.editor, view.file!.path));
      });
      this.registerDomEvent(
        doc,
        "contextmenu",
        (event) => {
          const target = event.target as HTMLElement;
          const image = target.closest?.("img");
          if (!image) return;
          let view: MarkdownView | undefined;
          this.app.workspace.iterateAllLeaves((leaf) => {
            if (
              leaf.view instanceof MarkdownView &&
              leaf.view.contentEl.contains(image)
            )
              view = leaf.view;
          });
          if (!view?.file) return;
          const source = image.closest("[src]")?.getAttribute("src") || "";
          const wrapper = image.closest(".internal-embed");
          const link = wrapper?.getAttribute("src");
          let file = link ? this.resolve(link, view.file.path) : null;
          if (!file)
            file =
              this.app.vault
                .getFiles()
                .find(
                  (f) =>
                    isImage(f.path) &&
                    this.app.vault.getResourcePath(f) === source,
                ) || null;
          if (!file) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          const notePath = view.file.path;
          const embeds = parseImages(view.editor.getValue()).filter(
            (e) => this.resolve(e.target, notePath)?.path === file.path,
          );
          // A rendered image does not reliably expose its source offset. Never
          // edit the first occurrence when the same file is embedded repeatedly.
          const embed = embeds.length === 1 ? embeds[0] : undefined;
          const context = embed
            ? {
                editor: view.editor,
                note: view.file,
                embed,
                before: view.editor.getValue(),
              }
            : undefined;
          const menu = new Menu();
          this.imageMenu(menu, file, context);
          menu.showAtMouseEvent(event);
        },
        { capture: true },
      );
    };
    attach(document);
    this.registerEvent(
      this.app.workspace.on("window-open", (_win, win) => attach(win.document)),
    );
    const updateImage = (file: import("obsidian").TAbstractFile) => {
      if (
        this.settings.duplicates &&
        file instanceof TFile &&
        isImage(file.path)
      )
        guarded(() => this.index.update(file));
    };
    this.registerEvent(this.app.vault.on("create", updateImage));
    this.registerEvent(this.app.vault.on("modify", updateImage));
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        this.index.entries.delete(file.path);
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, old) => {
        this.index.entries.delete(old);
        if (
          this.settings.duplicates &&
          file instanceof TFile &&
          isImage(file.path)
        )
          guarded(() => this.index.update(file));
      }),
    );
    this.registerInterval(
      window.setInterval(() => {
        void this.persist();
      }, 60000),
    );
  }
  persist() {
    this.saveQueue = this.saveQueue
      .catch(() => {})
      .then(() =>
        this.saveData({
          settings: this.settings,
          index: this.settings.persistIndex
            ? Array.from(this.index.entries.values())
            : [],
        }),
      );
    return this.saveQueue;
  }
  updateRibbon() {
    this.ribbon?.remove();
    if (this.settings.ribbon)
      this.ribbon = this.addRibbonIcon(
        "scaling",
        "Normalize image sizes",
        () => {
          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (view) this.normalizeModal(view.editor);
        },
      );
  }
  async copy(editor: Editor, path: string) {
    await copyMarkdown(
      this.app,
      editor.getSelection() || editor.getValue(),
      path,
      this.settings,
    );
    new Notice("Text and images copied");
  }
  resolve(target: string, source: string) {
    try {
      target = decodeURIComponent(target);
    } catch {
      /* Preserve literal percent characters in file names. */
    }
    const file = this.app.metadataCache.getFirstLinkpathDest(target, source);
    return file instanceof TFile ? file : null;
  }
  private contextAt(editor: Editor, note: TFile): EmbedContext | undefined {
    const before = editor.getValue(),
      offset = editor.posToOffset(editor.getCursor());
    const embed = parseImages(before).find(
      (e) => offset >= e.start && offset <= e.end,
    );
    return embed ? { editor, note, embed, before } : undefined;
  }
  private annotateAtCursor(editor: Editor, note: TFile) {
    const context = this.contextAt(editor, note);
    if (!context) {
      new Notice("Select an image embed, or right-click an image.");
      return;
    }
    const file = this.resolve(context.embed.target, note.path);
    if (file) new ImageEditorView(this, file, context).open();
    else new Notice("Image not found");
  }
  private imageMenu(menu: Menu, file: TFile, context?: EmbedContext) {
    const open = (
      tool: ConstructorParameters<typeof ImageEditorView>[3] = "select",
      color?: string,
    ) => new ImageEditorView(this, file, context, tool, color).open();
    menu.addItem((i) =>
      i
        .setTitle("Annotate")
        .setIcon("pencil")
        .onClick(() => open()),
    );
    if (this.settings.quickTools)
      for (const [title, tool, icon] of [
        ["Mark error", "rectangle", "circle-alert"],
        ["Add arrow", "arrow", "arrow-up-right"],
        ["Add rectangle", "rectangle", "square"],
        ["Add number", "number", "hash"],
      ] as const)
        menu.addItem((i) =>
          i
            .setTitle(title)
            .setIcon(icon)
            .onClick(() => {
              open(tool, title === "Mark error" ? "#ef4444" : undefined);
            }),
        );
    menu.addItem((i) =>
      i
        .setTitle("Copy image")
        .setIcon("copy")
        .onClick(() => {
          void (async () => {
            const source = toDataURL(
              await this.app.vault.readBinary(file),
              imageMime(file.extension),
            );
            await writeImage(source);
            new Notice("Image copied");
          })().catch((e) => new Notice(String(e)));
        }),
    );
    menu.addItem((i) =>
      i
        .setTitle("Copy image with annotations")
        .setIcon("copy")
        .onClick(() => {
          // Saved PNGs already contain the flattened annotations; unsaved edits
          // are copied by the editor's Copy action.
          void this.app.vault
            .readBinary(file)
            .then((bytes) =>
              writeImage(toDataURL(bytes, imageMime(file.extension))),
            )
            .then(() => {
              new Notice("Annotated image copied");
            })
            .catch((error) => new Notice(String(error)));
        }),
    );
    menu.addItem((i) =>
      i
        .setTitle("Open image")
        .setIcon("image")
        .onClick(() => {
          void this.app.workspace.getLeaf(false).openFile(file);
        }),
    );
    if (context) {
      menu.addItem((i) =>
        i
          .setTitle("Resize")
          .setIcon("scaling")
          .onClick(() => {
            void (async () => {
              const input = await askText(
                this.app,
                "Image width in pixels",
                String(context.embed.width || this.settings.width),
              );
              if (input === null) return;
              const width = Number(input);
              if (!Number.isInteger(width) || width < 1 || width > 16384) {
                new Notice("Width must be between 1 and 16384");
                return;
              }
              if (context.editor.getValue() !== context.before) {
                new Notice("Note changed; retry resize");
                return;
              }
              context.editor.replaceRange(
                resizedEmbed(
                  context.embed,
                  width,
                  this.settings.preserveHeight,
                ),
                context.editor.offsetToPos(context.embed.start),
                context.editor.offsetToPos(context.embed.end),
              );
            })();
          }),
      );
      menu.addItem((i) =>
        i
          .setTitle("Normalize note images")
          .setIcon("scaling")
          .onClick(() => this.normalizeModal(context.editor)),
      );
      menu.addItem((i) =>
        i
          .setTitle("Copy with images")
          .setIcon("copy")
          .onClick(() => {
            void this.copy(context.editor, context.note.path).catch(
              (e) => new Notice(String(e)),
            );
          }),
      );
    }
  }
  normalize(editor: Editor, width?: number, selection = false) {
    const source = selection ? editor.getSelection() : editor.getValue();
    if (selection && !source) {
      new Notice("Select content first");
      return;
    }
    try {
      const result = normalizeImages(
        source,
        width,
        this.settings.preserveHeight,
      );
      if (result === source) return;
      const from = selection ? editor.getCursor("from") : { line: 0, ch: 0 };
      const to = selection
        ? editor.getCursor("to")
        : editor.offsetToPos(source.length);
      editor.replaceRange(result, from, to);
      new Notice("Image sizes normalized");
    } catch (e) {
      new Notice(String(e));
    }
  }
  normalizeModal(editor: Editor) {
    const defaultWidth = this.settings.width;
    const apply = (width: number | undefined, selection: boolean) =>
      this.normalize(editor, width, selection);
    class Normalize extends Modal {
      onOpen() {
        this.titleEl.setText("Normalize image sizes");
        let width: number | undefined = defaultWidth,
          selection = false;
        const before = editor.getValue();
        new Setting(this.contentEl)
          .setName("Width (px)")
          .addText((t) =>
            t.setValue(String(width)).onChange((v) => (width = Number(v))),
          );
        new Setting(this.contentEl).setName("Preset").addDropdown((d) =>
          d
            .addOptions({
              custom: "Custom",
              400: "Small — 400px",
              600: "Medium — 600px",
              800: "Large — 800px",
              original: "Original",
            })
            .onChange((v) => {
              if (v !== "custom")
                width = v === "original" ? undefined : Number(v);
            }),
        );
        new Setting(this.contentEl).setName("Scope").addDropdown((d) =>
          d
            .addOptions({
              note: "Current note",
              selection: "Current selection",
            })
            .onChange((v) => (selection = v === "selection")),
        );
        new Setting(this.contentEl)
          .addButton((b) =>
            b.setButtonText("Cancel").onClick(() => this.close()),
          )
          .addButton((b) =>
            b
              .setButtonText("Apply")
              .setCta()
              .onClick(() => {
                if (editor.getValue() !== before) {
                  new Notice("Note changed; reopen normalization");
                  return;
                }
                apply(width, selection);
                this.close();
              }),
          );
      }
    }
    new Normalize(this.app).open();
  }
}

type RenderedSetting = SettingDefinitionRender & {
  render: (setting: Setting) => void;
};
type SettingField = {
  key: keyof Settings;
  name: string;
  options?: Record<string, string>;
  min?: number;
  max?: number;
};
class SettingsTab extends PluginSettingTab {
  constructor(private plugin: VisualKit) {
    super(plugin.app, plugin);
  }
  getSettingDefinitions(): (SettingDefinitionGroup & {
    items: RenderedSetting[];
  })[] {
    const groups: { name: string; fields: SettingField[] }[] = [
      {
        name: "Clipboard",
        fields: [
          {
            key: "copyMode",
            name: "Copy mode",
            options: {
              dedicated: "Dedicated",
              smart: "Smart copy",
              always: "Always rich copy",
            },
          },
          { key: "preserveFormatting", name: "Preserve formatting" },
          { key: "preserveResize", name: "Preserve resize" },
          { key: "movidesk", name: "Movidesk optimization" },
        ],
      },
      {
        name: "Editor",
        fields: [
          { key: "color", name: "Default color" },
          { key: "lineWidth", name: "Default line width", min: 1, max: 100 },
          { key: "fontSize", name: "Default font size", min: 8, max: 300 },
          {
            key: "saveMode",
            name: "Save mode",
            options: {
              new: "Save as new image",
              replace: "Replace original (confirm)",
              copy: "Save copy (custom name)",
            },
          },
          {
            key: "annotationFolder",
            name: "Annotation folder (empty = beside source)",
          },
          { key: "editable", name: "Preserve editable annotation data" },
        ],
      },
      {
        name: "Image sizing",
        fields: [
          {
            key: "width",
            name: "Default normalized width",
            min: 1,
            max: 16384,
          },
          { key: "preserveHeight", name: "Preserve explicit height" },
          { key: "normalizeCopy", name: "Normalize image sizes on copy" },
          { key: "ribbon", name: "Show normalization ribbon button" },
        ],
      },
      {
        name: "Paste",
        fields: [
          { key: "multiPaste", name: "Paste multiple images" },
          { key: "pasteWidth", name: "Apply default width to pasted images" },
          {
            key: "blankLines",
            name: "Insert blank line between pasted images",
          },
          { key: "naming", name: "Naming template: {note}-{date}-{counter}" },
          {
            key: "folder",
            name: "Image folder: attachments, attachments/{note}, images, same-folder or custom path",
          },
        ],
      },
      {
        name: "Duplicates",
        fields: [
          { key: "duplicates", name: "Enable duplicate detection" },
          {
            key: "duplicateAction",
            name: "When duplicate image is detected",
            options: {
              reuse: "Reuse existing",
              ask: "Ask",
              save: "Always save",
            },
          },
          { key: "persistIndex", name: "Maintain local hash index" },
        ],
      },
      {
        name: "QA",
        fields: [
          { key: "autoMarkers", name: "Auto increment markers" },
          { key: "quickTools", name: "Quick tools" },
        ],
      },
    ];
    return groups.map((group) => ({
      type: "group",
      heading: group.name,
      items: group.fields.map((field) => this.definition(field)),
    }));
  }
  private definition(field: SettingField): RenderedSetting {
    return {
      name: field.name,
      render: (setting) => {
        const value = this.plugin.settings[field.key];
        const save = (updated: string | boolean | number) => {
          Object.assign(this.plugin.settings, { [field.key]: updated });
          void this.plugin.persist();
          if (field.key === "ribbon") this.plugin.updateRibbon();
        };
        if (field.options)
          setting.addDropdown((control) =>
            control
              .addOptions(field.options ?? {})
              .setValue(String(value))
              .onChange(save),
          );
        else if (typeof value === "boolean")
          setting.addToggle((control) =>
            control.setValue(value).onChange(save),
          );
        else if (field.key === "color")
          setting.addColorPicker((control) =>
            control.setValue(String(value)).onChange(save),
          );
        else
          setting.addText((control) =>
            control.setValue(String(value)).onChange((input) => {
              if (typeof value === "number") {
                const n = Number(input);
                if (
                  Number.isInteger(n) &&
                  n >= (field.min ?? 1) &&
                  n <= (field.max ?? 16384)
                )
                  save(n);
              } else save(input);
            }),
          );
      },
    };
  }
  // Obsidian <1.13 uses this fallback; newer hosts render/search the same definitions.
  display() {
    const el = this.containerEl;
    el.empty();
    for (const group of this.getSettingDefinitions()) {
      new Setting(el).setName(group.heading ?? "").setHeading();
      for (const item of group.items ?? [])
        if ("render" in item && item.render)
          item.render(new Setting(el).setName(item.name));
    }
  }
}
