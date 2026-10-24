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
} from "obsidian";
import { defaults, Settings } from "./settings";
import { DuplicateIndex, HashEntry } from "./duplicates/DuplicateIndex";
import {
  isImage,
  parseImages,
  resizedEmbed,
  ImageEmbed,
} from "./sizing/ImageEmbedParser";
import { normalizeImages } from "./sizing/ImageSizeNormalizer";
import { imageFiles } from "./paste/ClipboardImageReader";
import { MultiImagePasteHandler } from "./paste/MultiImagePasteHandler";
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
    const stored = await this.loadData();
    this.settings = { ...defaults, ...stored?.settings };
    this.index = new DuplicateIndex(this.app);
    if (this.settings.persistIndex && Array.isArray(stored?.index))
      for (const e of stored.index as HashEntry[])
        if (e.path && e.hash) this.index.entries.set(e.path, e);
    this.paste = new MultiImagePasteHandler(this);
    this.addSettingTab(new SettingsTab(this));
    this.updateRibbon();
    const guarded = (action: () => Promise<unknown>) => {
      void action().catch((error) => new Notice(String(error), 10000));
    };
    this.addCommand({
      id: "copy-with-images",
      name: "Copy with Images",
      editorCallback: (editor, info) =>
        guarded(() => this.copy(editor, info.file?.path || "")),
    });
    this.addCommand({
      id: "copy-for-ticket",
      name: "Copy for Ticket",
      editorCallback: (editor, info) =>
        guarded(() => this.copy(editor, info.file?.path || "", true)),
    });
    this.addCommand({
      id: "normalize-image-sizes",
      name: "Normalize image sizes",
      editorCallback: (editor) => this.normalizeModal(editor),
    });
    this.addCommand({
      id: "normalize-default-width",
      name: "Normalize images using default width",
      hotkeys: [{ modifiers: ["Mod", "Alt"], key: "i" }],
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
        const context = this.contextAt(editor, info.file);
        if (context) {
          const file = this.resolve(context.embed.target, info.file.path);
          if (file) this.imageMenu(menu, file, context);
        }
        menu.addItem((item) =>
          item
            .setTitle("Copy for ticket")
            .setIcon("copy")
            .onClick(() =>
              guarded(() => this.copy(editor, info.file!.path, true)),
            ),
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
      this.registerDomEvent(doc, "contextmenu", (event) => {
        const target = event.target as HTMLElement;
        const image = target.closest?.("img");
        if (!image) return;
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view?.file || !view.contentEl.contains(image)) return;
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
        event.stopPropagation();
        const embed = parseImages(view.editor.getValue()).find(
          (e) => this.resolve(e.target, view.file!.path)?.path === file!.path,
        );
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
      });
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
  async copy(editor: Editor, path: string, ticket = false) {
    await copyMarkdown(
      this.app,
      editor.getSelection() || editor.getValue(),
      path,
      this.settings,
      ticket,
    );
    new Notice("Text and images copied");
  }
  resolve(target: string, source: string) {
    try {
      target = decodeURIComponent(target);
    } catch {}
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
      new Notice(
        "Place the cursor inside an image embed, or right-click an image.",
      );
      return;
    }
    const file = this.resolve(context.embed.target, note.path);
    if (file) new ImageEditorView(this, file, context).open();
    else new Notice("Image not found");
  }
  private imageMenu(menu: Menu, file: TFile, context?: EmbedContext) {
    const open = (
      tool: ConstructorParameters<typeof ImageEditorView>[3] = "select",
    ) => new ImageEditorView(this, file, context, tool).open();
    menu.addItem((i) =>
      i
        .setTitle("Annotate")
        .setIcon("pencil")
        .onClick(() => open()),
    );
    if (this.settings.quickTools)
      for (const [title, tool] of [
        ["Mark error", "rectangle"],
        ["Add arrow", "arrow"],
        ["Add rectangle", "rectangle"],
        ["Add number", "number"],
      ] as const)
        menu.addItem((i) =>
          i.setTitle(title).onClick(() => {
            if (title === "Mark error") this.settings.color = "#ef4444";
            open(tool);
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
      i.setTitle("Copy image with annotations").onClick(() => {
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
        i.setTitle("Resize").onClick(() => {
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
              new Notice("Note changed; retry Resize");
              return;
            }
            context.editor.replaceRange(
              resizedEmbed(context.embed, width, this.settings.preserveHeight),
              context.editor.offsetToPos(context.embed.start),
              context.editor.offsetToPos(context.embed.end),
            );
          })();
        }),
      );
      menu.addItem((i) =>
        i
          .setTitle("Normalize note images")
          .onClick(() => this.normalizeModal(context.editor)),
      );
      menu.addItem((i) =>
        i.setTitle("Copy for ticket").onClick(() => {
          void this.copy(context.editor, context.note.path, true).catch(
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
    const plugin = this;
    class Normalize extends Modal {
      onOpen() {
        this.titleEl.setText("Normalize image sizes");
        let width: number | undefined = plugin.settings.width,
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
                plugin.normalize(editor, width, selection);
                this.close();
              }),
          );
      }
    }
    new Normalize(this.app).open();
  }
}

class SettingsTab extends PluginSettingTab {
  constructor(private plugin: VisualKit) {
    super(plugin.app, plugin);
  }
  display() {
    const el = this.containerEl;
    el.empty();
    el.createEl("h2", { text: "Visual Kit" });
    el.createEl("p", {
      text: "All image processing stays local. Hotkeys can be changed in Obsidian → Hotkeys.",
    });
    const settings = this.plugin.settings;
    const save = () => {
      void this.plugin.persist();
    };
    const toggle = (key: keyof Settings, name: string) =>
      new Setting(el).setName(name).addToggle((t) =>
        t.setValue(settings[key] as boolean).onChange((v) => {
          (settings as unknown as Record<string, unknown>)[key] = v;
          save();
          if (key === "ribbon") this.plugin.updateRibbon();
        }),
      );
    const text = (key: keyof Settings, name: string) =>
      new Setting(el).setName(name).addText((t) =>
        t.setValue(String(settings[key])).onChange((v) => {
          (settings as unknown as Record<string, unknown>)[key] = v;
          save();
        }),
      );
    const number = (
      key: keyof Settings,
      name: string,
      min: number,
      max: number,
    ) =>
      new Setting(el).setName(name).addText((t) =>
        t.setValue(String(settings[key])).onChange((v) => {
          const n = Number(v);
          if (Number.isInteger(n) && n >= min && n <= max) {
            (settings as unknown as Record<string, unknown>)[key] = n;
            save();
          }
        }),
      );
    const select = (
      key: keyof Settings,
      name: string,
      options: Record<string, string>,
    ) =>
      new Setting(el).setName(name).addDropdown((d) =>
        d
          .addOptions(options)
          .setValue(String(settings[key]))
          .onChange((v) => {
            (settings as unknown as Record<string, unknown>)[key] = v;
            save();
          }),
      );
    el.createEl("h3", { text: "Clipboard" });
    select("copyMode", "Copy mode", {
      dedicated: "Dedicated",
      smart: "Smart Copy",
      always: "Always Rich Copy",
    });
    toggle("preserveFormatting", "Preserve formatting");
    toggle("preserveResize", "Preserve resize");
    toggle("movidesk", "Movidesk optimization");
    el.createEl("h3", { text: "Editor" });
    new Setting(el).setName("Default color").addColorPicker((c) =>
      c.setValue(settings.color).onChange((v) => {
        settings.color = v;
        save();
      }),
    );
    number("lineWidth", "Default line width", 1, 100);
    number("fontSize", "Default font size", 8, 300);
    select("saveMode", "Save mode", {
      new: "Save as new image",
      replace: "Replace original (confirm)",
      copy: "Save copy (custom name)",
    });
    text("annotationFolder", "Annotation folder (empty = beside source)");
    toggle("editable", "Preserve editable annotation data");
    el.createEl("h3", { text: "Image sizing" });
    number("width", "Default normalized width", 1, 16384);
    toggle("preserveHeight", "Preserve explicit height");
    toggle("normalizeCopy", "Normalize on Copy for Ticket");
    toggle("ribbon", "Show normalization ribbon button");
    el.createEl("h3", { text: "Paste" });
    toggle("multiPaste", "Paste multiple images");
    toggle("pasteWidth", "Apply default width to pasted images");
    toggle("blankLines", "Insert blank line between pasted images");
    text("naming", "Naming template: {note}-{date}-{counter}");
    text(
      "folder",
      "Image folder: attachments, attachments/{note}, images, same-folder or custom path",
    );
    el.createEl("h3", { text: "Duplicates" });
    toggle("duplicates", "Enable duplicate detection");
    select("duplicateAction", "When duplicate image is detected", {
      reuse: "Reuse existing",
      ask: "Ask",
      save: "Always save",
    });
    toggle("persistIndex", "Maintain local hash index");
    el.createEl("h3", { text: "QA" });
    toggle("autoMarkers", "Auto increment markers");
    toggle("quickTools", "Quick tools");
    el.createEl("p", {
      text: "Redaction uses solid, opaque rectangles. Export format: PNG. GIF originals are preserved.",
    });
  }
}
