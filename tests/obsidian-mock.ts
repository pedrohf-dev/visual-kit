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
  constructor(public app: unknown) {}
  open() {}
  close() {}
}
export class Setting {}
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
  registerEvent() {}
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
