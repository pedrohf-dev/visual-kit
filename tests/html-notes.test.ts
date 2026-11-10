import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { loadImage } from "canvas";
import {
  HtmlDocument,
  sanitizeHtml,
  parseHtml,
  newDocument,
  FRAME_POLICY,
  plainText,
  replaceBody,
  MAX_HTML,
} from "../src/html-notes/HtmlDocument";
import { HtmlPersistence, HtmlConflict } from "../src/html-notes/Persistence";
import { HtmlAssets, relativeImage, vaultPath } from "../src/html-notes/Assets";
import { exportHtml, copyHtml } from "../src/html-notes/Clipboard";
import { createHtmlNote, registerHtmlNotes } from "../src/html-notes/register";
import { defaults } from "../src/settings";
import { readStoredData } from "../src/storage";
import { TFile, TFolder, Notice, requests } from "./obsidian-mock";
import { DuplicateIndex } from "../src/duplicates/DuplicateIndex";
import { clipboard } from "./electron-mock";

const dom = new JSDOM("", { url: "https://obsidian.invalid" }).window;
Object.assign(globalThis, {
  document: dom.document,
  window: dom,
  NodeFilter: dom.NodeFilter,
  createEl: (tag: string, options: any = {}) => {
    const el = dom.document.createElement(tag);
    if (options.text) el.textContent = options.text;
    if (options.value !== undefined) el.setAttribute("value", options.value);
    for (const [key, value] of Object.entries(options.attr || {}))
      el.setAttribute(key, String(value));
    return el;
  },
  createFragment: () => dom.document.createDocumentFragment(),
  createSpan: () => dom.document.createElement("span"),
  createImageBitmap: async (blob: Blob) =>
    Object.assign(await loadImage(Buffer.from(await blob.arrayBuffer())), {
      close() {},
    }),
});
Object.defineProperty(dom.HTMLElement.prototype, "setCssStyles", {
  value(this: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
    Object.assign(this.style, styles);
  },
});
Object.assign(dom.HTMLElement.prototype, {
  setText(this: HTMLElement, text: string) {
    this.textContent = text;
  },
  empty(this: HTMLElement) {
    this.replaceChildren();
  },
  createDiv(
    this: HTMLElement,
    options: { cls?: string; attr?: Record<string, string> } = {},
  ) {
    const el = this.ownerDocument.createElement("div");
    el.className = options.cls || "";
    for (const [name, value] of Object.entries(options.attr || {}))
      el.setAttribute(name, value);
    this.append(el);
    return el;
  },
});
const ticket = readFileSync("tests/fixtures/support-ticket.html", "utf8");
const unsafe = readFileSync("tests/fixtures/unsupported-ticket.html", "utf8");

test("body replacement ignores deceptive titles/comments and respects quoted tag boundaries", () => {
  const source =
    "<!doctype html><html><head><title>Literal &lt;body&gt; label</title><!-- <body>keep</body> --></head><body><p>Original</p></body></html>";
  const model = new HtmlDocument(source);
  assert.deepEqual(model.safe.issues, []);
  model.editBody("<p>Updated</p>");
  assert.match(model.source, /<!-- <body>keep<\/body> -->/);
  assert.match(model.source, /<body><p>Updated<\/p><\/body>/);
  assert.equal(
    replaceBody('<body title="a>b"><p>Old</p></body>', "<p>New</p>"),
    '<body title="a>b"><p>New</p></body>',
  );
  const malformed = new HtmlDocument(
    "<html><head><title>x</title></head><body><p>Inside</p></body>Outside</html>",
  );
  assert.ok(malformed.safe.issues.length);
});

test("oversized source remains editable and intact without parsing a rendered representation", () => {
  const source = "x".repeat(MAX_HTML + 1),
    model = new HtmlDocument(source);
  assert.equal(model.source, source);
  assert.equal(model.safe.html, "");
  assert.ok(model.safe.issues.length);
  model.setSource("<p>Within limit</p>");
  assert.deepEqual(model.safe.issues, []);
});

function fixture() {
  const files = new Map<string, TFile>(),
    content = new Map<string, string>(),
    binaries = new Map<string, ArrayBuffer>(),
    folders = new Set<string>();
  const note = new TFile("tickets/response.html");
  files.set(note.path, note);
  content.set(note.path, ticket);
  let binaryWrites = 0;
  const app = {
    vault: {
      getAbstractFileByPath: (path: string) =>
        files.get(path) || (folders.has(path) ? new TFolder(path) : null),
      getFiles: () => [...files.values()],
      createFolder: async (path: string) => {
        folders.add(path);
      },
      create: async (path: string, source: string) => {
        if (files.has(path)) throw new Error("Already exists");
        const file = new TFile(path);
        files.set(path, file);
        content.set(path, source);
        return file;
      },
      read: async (file: TFile) => content.get(file.path)!,
      readBinary: async (file: TFile) => binaries.get(file.path)!,
      createBinary: async (path: string, bytes: ArrayBuffer) => {
        if (files.has(path)) throw new Error("Already exists");
        const file = new TFile(path, bytes.byteLength);
        files.set(path, file);
        binaries.set(path, bytes);
        binaryWrites++;
        return file;
      },
    },
  };
  const plugin = {
    app,
    settings: { ...defaults },
    index: new DuplicateIndex(app as never),
    persist: async () => {},
  };
  return {
    plugin,
    note,
    files,
    content,
    binaries,
    binaryWrites: () => binaryWrites,
  };
}

test("round-trip proof: a representative support response remains byte-identical without editing", async () => {
  const model = new HtmlDocument(ticket);
  assert.deepEqual(model.safe.issues, []);
  const persistence = new HtmlPersistence(model.source, async () => {
    throw new Error("No write should occur");
  });
  await persistence.save();
  assert.equal(model.source, ticket);
  assert.match(model.safe.bodyStyle, /font-family/);
});
test("round-trip proof: editing text preserves spans, inline formatting, lists, links and image sizes", () => {
  const model = new HtmlDocument(ticket),
    body = parseHtml(model.safe.html).body;
  body.querySelector("strong")!.textContent = "team";
  model.editBody(body.innerHTML);
  const reopened = new HtmlDocument(model.source),
    parsed = parseHtml(reopened.safe.html);
  assert.deepEqual(reopened.safe.issues, []);
  assert.equal(parsed.querySelector("th")!.getAttribute("colspan"), "2");
  assert.equal(parsed.querySelector("td")!.getAttribute("rowspan"), "2");
  assert.equal(parsed.querySelector("img")!.getAttribute("width"), "480");
  assert.equal(
    parsed.querySelector("img")!.getAttribute("src"),
    "../attachments/screen%20one.png",
  );
  assert.equal(parsed.querySelector("ol")!.getAttribute("start"), "2");
  assert.ok(parsed.querySelector("ol ul li b"));
  assert.match(model.source, /<title>Support ticket response<\/title>/);
  assert.match(
    parsed.querySelector("span")!.getAttribute("style")!,
    /background-color/,
  );
});
test("unsupported documents retain original source, render safely, and refuse visual overwrite", () => {
  const model = new HtmlDocument(unsafe);
  assert.equal(model.source, unsafe);
  assert.ok(model.safe.issues.length > 0);
  const root = parseHtml(model.safe.html);
  assert.equal(
    root.querySelector("script,style,iframe,object,[onerror],[onclick]"),
    null,
  );
  assert.doesNotMatch(
    model.safe.html,
    /javascript:|position:|background-image:|https:\/\/attacker/,
  );
  assert.throws(() => model.editBody("<p>degraded</p>"));
  assert.equal(model.source, unsafe);
});
test("sanitization rejects malicious URLs, CSS resources, forms, SVG and DOM clobbering", () => {
  for (const payload of [
    '<a href="jav&#x61;script:alert(1)">x</a>',
    '<img src="file:///secret.png" onerror="alert(1)">',
    '<svg><a href="javascript:alert(1)">x</a></svg>',
    '<form id="body"><input name="innerHTML"></form>',
    '<div style="background-color:red;background-image:url(https://tracker.invalid);position:fixed">x</div>',
    '<img src="data:image/svg+xml;base64,PHN2Zz4=">',
    '<object data="file:///secret"></object>',
  ]) {
    const result = sanitizeHtml(payload);
    assert.ok(result.issues.length, payload);
    const root = parseHtml(result.html);
    assert.equal(
      root.querySelector("svg,form,input,object,[onerror],[id],[name]"),
      null,
    );
    assert.doesNotMatch(
      result.html,
      /javascript:|file:\/|data:image\/svg|url\(|position:/i,
    );
  }
  assert.match(FRAME_POLICY, /script-src 'none'/);
  assert.match(FRAME_POLICY, /connect-src 'none'/);
});
test("plain-text output includes paragraphs, cell separators, image labels and line breaks", () => {
  const plain = plainText(
    '<p>Hello<br>world</p><table><tr><td>A</td><td>B</td></tr></table><img alt="Evidence" src="a.png">',
  );
  assert.match(plain, /Hello\nworld\n/);
  assert.match(plain, /A\tB\t/);
  assert.match(plain, /\[Evidence\]/);
});
test("atomic saves never overwrite externally modified content", async () => {
  let disk = "original";
  const persistence = new HtmlPersistence(disk, async (change) => {
    disk = change(disk);
  });
  persistence.current = "local edit";
  disk = "external edit";
  await assert.rejects(persistence.save(), HtmlConflict);
  assert.equal(disk, "external edit");
  assert.equal(persistence.current, "local edit");
});
test("serialized autosave retains edits made during a pending write and recovers from errors", async () => {
  let disk = "a",
    release!: () => void;
  let first = true,
    active = 0,
    max = 0;
  const persistence = new HtmlPersistence(disk, async (change) => {
    active++;
    max = Math.max(max, active);
    if (first) {
      first = false;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    }
    disk = change(disk);
    active--;
  });
  persistence.current = "b";
  const pending = persistence.save();
  await new Promise((resolve) => setImmediate(resolve));
  persistence.current = "c";
  const next = persistence.save();
  release();
  await Promise.all([pending, next]);
  assert.equal(disk, "c");
  assert.equal(max, 1);
  assert.equal(persistence.dirty, false);
  const failed = new HtmlPersistence("a", async () => {
    throw new Error("Disk full");
  });
  failed.current = "b";
  await assert.rejects(failed.save(), /Disk full/);
  assert.equal(failed.dirty, true);
  assert.equal(failed.baseline, "a");
});
test("new HTML notes use real vault files and avoid overwrites and directory traversal", async () => {
  const f = fixture();
  const first = await createHtmlNote(
      f.plugin as never,
      "tickets",
      "Response.html",
    ),
    next = await createHtmlNote(f.plugin as never, "tickets", "Response.html");
  assert.equal(first.path, "tickets/Response.html");
  assert.equal(next.path, "tickets/Response-1.html");
  assert.equal(f.content.get(first.path), newDocument());
  for (const folder of ["/", ""])
    assert.match(
      (await createHtmlNote(f.plugin as never, folder, "Root.html")).path,
      /^Root(?:-\d+)?\.html$/,
    );
  for (const folder of ["../outside", "/outside", "C:\\outside", "..\\outside"])
    await assert.rejects(
      createHtmlNote(f.plugin as never, folder, "bad"),
      /HTML note folder must be relative to the vault/,
    );
});

function creationFixture() {
  const f = fixture(),
    commands = new Map<string, () => void>(),
    handlers = new Map<string, (...args: any[]) => void>(),
    cleanups: (() => void)[] = [],
    opened: string[] = [];
  let leaves: { view: { containerEl: HTMLElement } }[] = [];
  const explorer = document.createElement("div");
  explorer.innerHTML =
    '<div class="nav-buttons-container"><div class="nav-action-button" data-action="new-note"></div><div class="nav-action-button" data-action="new-folder"></div></div>';
  document.body.append(explorer);
  leaves = [{ view: { containerEl: explorer } }];
  const plugin = Object.assign(f.plugin, {
    registerView() {},
    registerExtensions() {},
    registerEvent() {},
    register(cleanup: () => void) {
      cleanups.push(cleanup);
    },
    addCommand(command: { id: string; callback?: () => void }) {
      if (command.callback) commands.set(command.id, command.callback);
    },
  });
  Object.assign(plugin.app, {
    workspace: {
      getActiveFile: () => ({ parent: { path: "/" } }),
      getLeavesOfType: () => leaves,
      onLayoutReady: (callback: () => void) => callback(),
      on: (event: string, callback: (...args: any[]) => void) =>
        handlers.set(event, callback),
      getLeaf: () => ({
        setViewState: async (state: { state: { file: string } }) => {
          opened.push(state.state.file);
        },
      }),
    },
  });
  registerHtmlNotes(plugin as never);
  return {
    ...f,
    explorer,
    commands,
    handlers,
    opened,
    setLeaves: (next: typeof leaves) => (leaves = next),
    unload: () => cleanups.forEach((cleanup) => cleanup()),
  };
}

test("explorer shortcut and command create HTML notes with a focused name and Enter at the vault root", async () => {
  const f = creationFixture();
  Notice.messages.length = 0;
  try {
    const button = f.explorer.querySelector<HTMLElement>(".vk-add-html-note")!;
    assert.equal(
      button.previousElementSibling?.getAttribute("data-action"),
      "new-note",
    );
    assert.equal(button.getAttribute("aria-label"), "Add HTML note");
    for (const start of [
      () => button.click(),
      f.commands.get("create-html-note")!,
    ]) {
      start();
      const input = document.querySelector<HTMLInputElement>(".modal input")!;
      assert.equal(document.activeElement, input);
      assert.equal(input.value, "Untitled");
      assert.equal(input.selectionStart, 0);
      assert.equal(input.selectionEnd, input.value.length);
      input.value = "Quick response";
      input.dispatchEvent(
        new dom.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(document.querySelector(".modal"), null);
    }
    assert.deepEqual(f.opened, [
      "Quick response.html",
      "Quick response-1.html",
    ]);
    assert.equal(f.content.get(f.opened[0]), newDocument());
    assert.deepEqual(Notice.messages, []);
  } finally {
    f.unload();
    document.body.replaceChildren();
  }
});

test("HTML creation supports cancellation, IME entry, default folders and folder-menu overrides", async () => {
  const f = creationFixture();
  try {
    const start = f.commands.get("create-html-note")!;
    start();
    document
      .querySelector(".modal input")!
      .dispatchEvent(
        new dom.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(f.opened, []);
    f.plugin.settings.htmlFolder = "HTML Notes";
    start();
    const input = document.querySelector<HTMLInputElement>(".modal input")!;
    input.value = "Named.htm";
    input.dispatchEvent(
      new dom.KeyboardEvent("keydown", { key: "Enter", isComposing: true }),
    );
    assert.ok(document.querySelector(".modal"));
    document.querySelectorAll<HTMLButtonElement>(".modal button")[1].click();
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(f.opened, ["HTML Notes/Named.html"]);
    let createInFolder!: () => void;
    f.handlers.get("file-menu")!(
      {
        addItem(callback: (item: any) => void) {
          const item = {
            setTitle() {
              return item;
            },
            setIcon() {
              return item;
            },
            onClick(callback: () => void) {
              createInFolder = callback;
              return item;
            },
          };
          callback(item);
        },
      },
      new TFolder("Selected"),
    );
    createInFolder();
    document
      .querySelector<HTMLInputElement>(".modal input")!
      .dispatchEvent(new dom.KeyboardEvent("keydown", { key: "Enter" }));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(f.opened.at(-1), "Selected/Untitled.html");
  } finally {
    f.unload();
    document.body.replaceChildren();
  }
});

test("explorer shortcut follows layout changes without duplicates and is removed on unload", () => {
  const f = creationFixture();
  const sync = f.handlers.get("layout-change")!;
  try {
    sync();
    sync();
    assert.equal(f.explorer.querySelectorAll(".vk-add-html-note").length, 1);
    f.explorer.querySelector(".vk-add-html-note")!.remove();
    sync();
    assert.equal(f.explorer.querySelectorAll(".vk-add-html-note").length, 1);
    f.setLeaves([]);
    sync();
    assert.equal(f.explorer.querySelector(".vk-add-html-note"), null);
    f.setLeaves([{ view: { containerEl: f.explorer } }]);
    sync();
    assert.ok(f.explorer.querySelector(".vk-add-html-note"));
    f.unload();
    sync();
    assert.equal(f.explorer.querySelector(".vk-add-html-note"), null);
  } finally {
    f.unload();
    document.body.replaceChildren();
  }
});
test("templates create independent notes and retain portable image references", async () => {
  const f = creationFixture();
  try {
    await f.plugin.app.vault.create(
      "HTML Templates/Letter.html",
      '<p>Dear customer</p><img src="../attachments/logo.png">',
    );
    f.commands.get("create-html-note")!();
    const select = document.querySelector<HTMLSelectElement>(
      'select[aria-label="Template"]',
    )!;
    assert.equal(select.options.length, 2);
    select.value = "HTML Templates/Letter.html";
    select.dispatchEvent(new dom.Event("change"));
    document
      .querySelector<HTMLInputElement>(".modal input")!
      .dispatchEvent(new dom.KeyboardEvent("keydown", { key: "Enter" }));
    await new Promise((resolve) => setImmediate(resolve));
    assert.match(f.content.get("Untitled.html")!, /Dear customer/);
    assert.match(
      f.content.get("Untitled.html")!,
      /src="attachments\/logo.png"/,
    );
    assert.match(
      f.content.get("HTML Templates/Letter.html")!,
      /src="\.\.\/attachments/,
    );
  } finally {
    f.unload();
    document.body.replaceChildren();
  }
});

test("semantic HTML and flex/grid formatting survive visual editing", () => {
  const source =
    '<section style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><figure style="border-radius:8px;box-shadow:0 2px 4px gray"><figcaption><mark>Caption</mark></figcaption></figure><details open><summary>Details</summary><dl><dt>Key</dt><dd>Value</dd></dl></details></section>';
  const model = new HtmlDocument(source);
  assert.deepEqual(model.safe.issues, []);
  model.editBody(model.safe.html);
  assert.match(model.source, /grid-template-columns/);
  assert.match(model.source, /<details open/);
});

test("portable vault paths resolve encoded filenames and reject external and escaping paths", () => {
  assert.equal(
    vaultPath("../attachments/screen%20one.png", "tickets/note.html"),
    "attachments/screen one.png",
  );
  assert.equal(
    relativeImage("attachments/screen one.png", "tickets/note.html"),
    "../attachments/screen%20one.png",
  );
  for (const source of [
    "../../secret",
    "file:///secret",
    "app://secret",
    "/secret",
    "..%5Csecret",
  ])
    assert.equal(vaultPath(source, "tickets/note.html"), null);
});
test("image imports reuse validation, attachment naming and deduplication while preserving dimensions", async () => {
  const f = fixture(),
    assets = new HtmlAssets(f.plugin as never),
    root = document.createElement("div");
  const png = new File(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 9])],
    "screen.png",
  );
  root.innerHTML =
    '<p>Before<img src="cid:private" width="480" height="270">After</p>';
  assert.deepEqual(await assets.import(root, f.note as never, [png]), []);
  const source = root.querySelector("img")!.getAttribute("src")!;
  assert.match(source, /^\.\.\/attachments\//);
  assert.equal(f.binaryWrites(), 1);
  assert.equal(root.querySelector("img")!.width, 480);
  root.querySelector("img")!.src = "cid:another";
  await assets.import(root, f.note as never, [png]);
  assert.equal(f.binaryWrites(), 1);
  await assert.rejects(
    assets.validate(new File(["<svg onload='x'/>"], "a.svg")),
    /SVG/,
  );
});
test("failed remote images retain their position and reference with actionable feedback", async () => {
  const f = fixture(),
    root = document.createElement("div");
  root.innerHTML = '<p>Before<img src="https://example.com/private">After</p>';
  const errors = await new HtmlAssets(f.plugin as never).import(
    root,
    f.note as never,
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /browser login/);
  assert.equal(
    root.querySelector("img")!.getAttribute("src"),
    "https://example.com/private",
  );
  assert.match(root.textContent!, /BeforeAfter/);
});
test("blocking remote images prevents network requests", async () => {
  const f = fixture();
  f.plugin.settings.htmlExternalImages = "block";
  requests.length = 0;
  await assert.rejects(
    new HtmlAssets(f.plugin as never).bytes(
      "https://example.com/private",
      f.note as never,
    ),
    /blocked/,
  );
  assert.equal(requests.length, 0);
});
test("rich HTML copy exports fragments with typography, tables and both clipboard formats", async () => {
  const f = fixture();
  const html =
    '<p style="font-family:Georgia;color:#123456;font-size:18px">Hello <b>team</b></p><table><tr><td colspan="2">Value</td></tr></table>';
  await copyHtml(f.plugin as never, f.note as never, html);
  assert.match(clipboard.last.html, /font-family:Georgia/);
  assert.match(clipboard.last.html, /colspan="2"/);
  assert.match(clipboard.last.text, /Hello team/);
  assert.doesNotMatch(clipboard.last.html, /<html|<body|<head/);
});
test("image copy embeds vault bytes, preserves sizes and leaves the clipboard unchanged on failure", async () => {
  const f = fixture(),
    canvas = document.createElement("canvas");
  canvas.width = 20;
  canvas.height = 10;
  const data = Buffer.from(
    canvas.toDataURL("image/png").split(",")[1],
    "base64",
  );
  await f.plugin.app.vault.createBinary(
    "attachments/evidence.png",
    Uint8Array.from(data).buffer,
  );
  const result = await exportHtml(
    f.plugin as never,
    f.note as never,
    '<p>Evidence<img src="../attachments/evidence.png" width="10" height="5"></p>',
  );
  assert.match(result.html, /data:image\/png;base64,/);
  assert.match(result.html, /width="10" height="5"/);
  assert.doesNotMatch(result.html, /app:|\.\.\/attachments/);
  clipboard.last = { html: "untouched", text: "untouched" };
  await assert.rejects(
    copyHtml(f.plugin as never, f.note as never, '<img src="../missing.png">'),
    /Clipboard unchanged/,
  );
  assert.equal(clipboard.last.html, "untouched");
});
test("HTML handler conflicts do not unregister other plugins and explicit opening remains available", () => {
  const commands: any[] = [],
    handlers: any[] = [];
  let registered = 0;
  const plugin = {
    settings: { ...defaults },
    registerView() {
      registered++;
    },
    registerExtensions() {
      throw new Error("Already registered");
    },
    addCommand(command: unknown) {
      commands.push(command);
    },
    registerEvent() {},
    register() {},
    app: {
      workspace: {
        onLayoutReady() {},
        on(_event: string, callback: unknown) {
          handlers.push(callback);
        },
      },
    },
  };
  Notice.messages.length = 0;
  registerHtmlNotes(plugin as never);
  assert.equal(registered, 1);
  assert.equal(commands.length, 4);
  assert.ok(
    Notice.messages.every((message) => message.includes("Another plugin")),
  );
  assert.equal(handlers.length, 2);
  plugin.settings.htmlNotes = false;
  registerHtmlNotes(plugin as never);
  assert.equal(registered, 1);
});
test("HTML settings validate modes and default to preserving document typography", () => {
  const settings = readStoredData({
    settings: {
      htmlDefaultMode: "invalid",
      htmlExternalImages: "script",
      htmlNotes: false,
    },
  }).settings;
  assert.equal(settings.htmlDefaultMode, "visual");
  assert.equal(settings.htmlExternalImages, "download");
  assert.equal(settings.htmlNotes, false);
  assert.equal(settings.htmlClipboardCompatibility, false);
});
