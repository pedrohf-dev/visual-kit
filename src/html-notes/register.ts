import { Notice, TFile, TFolder } from "obsidian";
import type VisualKit from "../main";
import { askText } from "../ui";
import { ensureFolder, uniquePath } from "../paste/ImageFileWriter";
import { imageFolder, safeName } from "../paste/ImageNamingService";
import { HtmlNoteView, HTML_VIEW } from "./HtmlNoteView";
import { newDocument } from "./HtmlDocument";

export async function createHtmlNote(
  plugin: VisualKit,
  folder: string,
  name: string,
) {
  const normalized = imageFolder(folder, "", "");
  const basename = safeName(name.replace(/\.html?$/i, "").trim() || "Untitled");
  await ensureFolder(plugin.app, normalized);
  // Vault.create also rejects collisions occurring after this check.
  return plugin.app.vault.create(
    uniquePath(plugin.app, normalized, `${basename}.html`),
    newDocument(),
  );
}

export function registerHtmlNotes(plugin: VisualKit) {
  if (!plugin.settings.htmlNotes) return;
  const run = (action: () => Promise<unknown>) => {
    void action().catch((error) => new Notice(String(error), 12000));
  };
  plugin.registerView(HTML_VIEW, (leaf) => new HtmlNoteView(leaf, plugin));
  if (plugin.settings.htmlRegisterExtensions) {
    for (const extension of ["html", "htm"]) {
      try {
        plugin.registerExtensions([extension], HTML_VIEW);
      } catch {
        new Notice(
          `Another plugin handles .${extension} files. Visual Kit kept that handler. Use Open in HTML notes from the file menu, or disable automatic HTML file handling in settings and reload.`,
          15000,
        );
      }
    }
  }
  const open = async (file: TFile) => {
    const leaf = plugin.app.workspace.getLeaf("tab");
    await leaf.setViewState({
      type: HTML_VIEW,
      state: { file: file.path },
      active: true,
    });
  };
  const create = async (folder?: string) => {
    const name = await askText(
      plugin.app,
      "Create HTML note — file name",
      "Untitled.html",
    );
    if (name === null) return;
    const file = await createHtmlNote(
      plugin,
      folder ??
        (plugin.settings.htmlFolder ||
          plugin.app.workspace.getActiveFile()?.parent?.path ||
          ""),
      name,
    );
    await open(file);
  };
  plugin.addCommand({
    id: "create-html-note",
    name: "Create HTML note",
    callback: () => run(() => create()),
  });
  for (const [id, name, whole] of [
    ["copy-as-rich-html", "Copy as rich HTML", false],
    ["copy-whole-html-note", "Copy whole HTML note", true],
  ] as const)
    plugin.addCommand({
      id,
      name,
      checkCallback: (checking) => {
        const view = plugin.app.workspace.getActiveViewOfType(HtmlNoteView);
        if (!view) return false;
        if (!checking) run(() => view.copy(whole));
        return true;
      },
    });
  plugin.registerEvent(
    plugin.app.workspace.on("file-menu", (menu, file) => {
      if (file instanceof TFolder)
        menu.addItem((item) =>
          item
            .setTitle("Create HTML note")
            .setIcon("file-plus")
            .onClick(() => run(() => create(file.path))),
        );
      if (file instanceof TFile && /\.html?$/i.test(file.path))
        menu.addItem((item) =>
          item
            .setTitle("Open in HTML notes")
            .setIcon("file-code")
            .onClick(() => run(() => open(file))),
        );
    }),
  );
}
