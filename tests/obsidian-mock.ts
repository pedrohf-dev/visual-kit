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
