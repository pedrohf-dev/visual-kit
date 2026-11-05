export class TFile {
  path: string;
  extension: string;
  basename: string;
  name: string;
  parent: { path: string };
  stat: { size: number; mtime: number };
  constructor(path: string, size = 0) {
    this.path = path;
    this.name = path.split("/").at(-1)!;
    this.extension = path.split(".").at(-1)!;
    this.basename = this.name.replace(/\.[^.]+$/, "");
    this.parent = { path: path.split("/").slice(0, -1).join("/") };
    this.stat = { size, mtime: 1 };
  }
}
export class Notice {
  static messages: string[] = [];
  constructor(message: string) {
    Notice.messages.push(message);
  }
  setMessage(message: string) {
    Notice.messages.push(message);
  }
  hide() {}
}
export class Modal {
  modalEl: HTMLElement;
  titleEl: HTMLElement;
  contentEl: HTMLElement;
  constructor(public app: unknown) {
    this.modalEl = document.createElement("div");
    this.modalEl.className = "modal";
    this.titleEl = document.createElement("h2");
    this.contentEl = document.createElement("div");
    this.modalEl.append(this.titleEl, this.contentEl);
    this.modalEl.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.close();
    });
  }
  onOpen() {}
  onClose() {}
  open() {
    document.body.append(this.modalEl);
    this.onOpen();
  }
  close() {
    this.modalEl.remove();
    this.onClose();
  }
}
export class Setting {
  constructor(private container: HTMLElement) {}
  addText(callback: (text: any) => void) {
    const inputEl = document.createElement("input");
    this.container.append(inputEl);
    const text = {
      inputEl,
      setValue(value: string) {
        inputEl.value = value;
        return text;
      },
      onChange(change: (value: string) => void) {
        inputEl.addEventListener("input", () => change(inputEl.value));
        return text;
      },
    };
    callback(text);
    return this;
  }
  addButton(callback: (button: any) => void) {
    const buttonEl = document.createElement("button");
    this.container.append(buttonEl);
    const button = {
      setButtonText(text: string) {
        buttonEl.textContent = text;
        return button;
      },
      setCta() {
        return button;
      },
      onClick(click: () => void) {
        buttonEl.onclick = click;
        return button;
      },
    };
    callback(button);
    return this;
  }
}
export function setIcon(el: HTMLElement, icon: string) {
  el.setAttribute("data-icon", icon);
}
export function setTooltip(el: HTMLElement, tooltip: string) {
  el.setAttribute("aria-label", tooltip);
}
export const requests: string[] = [];
export async function requestUrl(options: { url: string }) {
  requests.push(options.url);
  return { status: 403, arrayBuffer: new ArrayBuffer(0) };
}
export function sanitizeHTMLToDom(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
}
export function htmlToMarkdown(fragment: DocumentFragment) {
  return fragment.textContent || "";
}
export class PluginSettingTab {}
export class TFolder {
  constructor(public path: string) {}
}
export class FileView {
  app: any;
  file: TFile | null = null;
  contentEl!: HTMLElement;
  constructor(public leaf: unknown) {
    this.app = (leaf as { app?: unknown })?.app;
    if (typeof document !== "undefined")
      this.contentEl = document.createElement("div");
  }
  registerEvent() {}
  async onRename(_file: TFile) {}
}
export class MarkdownView {}
export class Plugin {
  app: any;
  async loadData() {
    return {};
  }
  addSettingTab() {}
  addRibbonIcon() {
    return { remove() {} };
  }
  addCommand() {}
  register() {}
  registerEvent() {}
  registerView() {}
  registerExtensions() {}
  registerInterval(id: number) {
    window.clearInterval(id);
  }
  registerDomEvent(
    el: Document,
    type: string,
    callback: EventListener,
    options?: AddEventListenerOptions,
  ) {
    el.addEventListener(type, callback, options);
  }
}
export class Menu {
  static shown: Menu[] = [];
  items: MenuItem[] = [];
  addItem(callback: (item: MenuItem) => void) {
    const item = new MenuItem();
    callback(item);
    this.items.push(item);
    return this;
  }
  showAtMouseEvent() {
    Menu.shown.push(this);
  }
}
class MenuItem {
  title = "";
  icon = "";
  callback = () => {};
  setTitle(title: string) {
    this.title = title;
    return this;
  }
  setIcon(icon: string) {
    this.icon = icon;
    return this;
  }
  onClick(callback: () => void) {
    this.callback = callback;
    return this;
  }
}
export class Component {
  load() {}
  unload() {}
}
export class MarkdownRenderer {
  static render(_app: unknown, markdown: string, root: HTMLElement) {
    root.innerHTML = `<p>${markdown}</p>`;
    return Promise.resolve();
  }
}
export function normalizePath(path: string) {
  return path.replaceAll("\\", "/").replace(/\/{2,}/g, "/");
}
