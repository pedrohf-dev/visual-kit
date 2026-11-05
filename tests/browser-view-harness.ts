import { HtmlNoteView } from "../src/html-notes/HtmlNoteView";
import { TFile } from "./obsidian-mock";
import { defaults } from "../src/settings";
import { clipboard } from "./electron-mock";

export function installViewHarness() {
  const create = function (
    this: HTMLElement,
    tag: string,
    options: {
      cls?: string;
      text?: string;
      value?: string;
      type?: string;
      attr?: Record<string, string>;
    } = {},
  ) {
    const el = this.ownerDocument.createElement(tag);
    if (options.cls) el.className = options.cls;
    if (options.text) el.textContent = options.text;
    if (options.value) el.setAttribute("value", options.value);
    if (options.type) el.setAttribute("type", options.type);
    for (const [key, value] of Object.entries(options.attr || {}))
      el.setAttribute(key, value);
    this.append(el);
    return el;
  };
  Object.assign(HTMLElement.prototype, {
    createEl: create,
    createDiv(this: HTMLElement, options: object = {}) {
      return create.call(this, "div", options);
    },
    empty(this: HTMLElement) {
      this.replaceChildren();
    },
    addClass(this: HTMLElement, name: string) {
      this.classList.add(name);
    },
  });
  let view: HtmlNoteView, file: TFile, disk: string;
  let writes = 0;
  const backups = new Map<string, string>(),
    listeners: Record<string, ((file: TFile) => void)[]> = {};
  Object.assign(window, {
    vkViewTest: {
      async mount(source: string) {
        if (view) await view.onClose();
        backups.clear();
        writes = 0;
        for (const key of Object.keys(listeners)) delete listeners[key];
        disk = source;
        file = new TFile("tickets/response.html");
        const app = {
          vault: {
            read: async () => disk,
            process: async (
              _file: unknown,
              change: (value: string) => string,
            ) => {
              disk = change(disk);
              writes++;
              listeners.modify?.forEach((callback) => callback(file));
              return disk;
            },
            on: (event: string, callback: (file: TFile) => void) => {
              (listeners[event] ||= []).push(callback);
            },
            getAbstractFileByPath: (path: string) =>
              backups.has(path) ? new TFile(path) : null,
            create: async (path: string, value: string) => {
              backups.set(path, value);
              return new TFile(path);
            },
          },
        };
        const plugin = {
          app,
          settings: { ...defaults },
          persist: async () => {},
        };
        view = new HtmlNoteView({ app } as never, plugin as never);
        view.file = file as never;
        document.getElementById("host")!.replaceChildren(view.contentEl);
        view.contentEl.style.height = "850px";
        await view.onOpen();
        await view.onLoadFile(file as never);
      },
      get disk() {
        return disk;
      },
      get writes() {
        return writes;
      },
      get backups() {
        return [...backups];
      },
      get clipboard() {
        return clipboard.last;
      },
      async external(source: string) {
        disk = source;
        listeners.modify?.forEach((callback) => callback(file));
      },
      async close() {
        await view.onUnloadFile();
      },
    },
  });
}
