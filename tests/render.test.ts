import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { Canvas, StaticCanvas, Rect, FabricImage, Point } from "fabric";
import { ImageEditorView } from "../src/editor/ImageEditorView";
import { defaults } from "../src/settings";
import { TFile } from "./obsidian-mock";
import { clipboard } from "./electron-mock";
import { copyMarkdown } from "../src/clipboard/HtmlClipboard";
import { parseAnnotation } from "../src/editor/persistence/AnnotationSerializer";
import VisualKit from "../src/main";
import { Menu, MarkdownView } from "./obsidian-mock";
import { requests } from "./obsidian-mock";
import { htmlImagePaste } from "../src/paste/HtmlImagePaste";
import { readImage } from "../src/paste/ClipboardImageReader";
import { loadImage } from "canvas";
import { prepareCopyImage } from "../src/clipboard/CopyImage";
import { formatCopy } from "../src/clipboard/CopyFormatting";
import { settingDescriptions } from "../src/settingDescriptions";
import { readStoredData } from "../src/storage";

const { window: dom } = new JSDOM();
Object.assign(globalThis, {
  document: dom.document,
  window: dom,
  NodeFilter: dom.NodeFilter,
  HTMLAnchorElement: dom.HTMLAnchorElement,
  HTMLImageElement: dom.HTMLImageElement,
  createFragment: () => dom.document.createDocumentFragment(),
  createDiv: () => dom.document.createElement("div"),
  createSpan: () => dom.document.createElement("span"),
  createEl: (tag: string) => dom.document.createElement(tag),
  createImageBitmap: async (blob: Blob) => {
    const image = await loadImage(Buffer.from(await blob.arrayBuffer()));
    return Object.assign(image, { close() {} });
  },
});
Object.defineProperty(dom.HTMLElement.prototype, "setCssStyles", {
  value: function (this: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
    Object.assign(this.style, styles);
  },
});
Object.defineProperty(dom.Element.prototype, "instanceOf", {
  value: function (this: Element, type: { name: string }) {
    return this.tagName === (type.name === "HTMLAnchorElement" ? "A" : "IMG");
  },
});
test("HTML paste preserves mixed image/text order and reads embedded image bytes", async () => {
  const html =
    '<img alt="image.png" src="data:image/png;base64,iVBORw0KGgo=">texto enche linguica<img src="data:image/png;base64,iVBORw0KGgo="><img src="data:image/png;base64,iVBORw0KGgo=">';
  const result = htmlImagePaste(html, [])!;
  assert.equal(result.images.length, 3);
  assert.equal(
    result.render(["![[a.png]]", "![[b.png]]", "![[c.png]]"]),
    "![[a.png]]texto enche linguica![[b.png]]![[c.png]]",
  );
  assert.equal(
    (await readImage(await result.images[0].load())).extension,
    "png",
  );
  assert.ok(
    result
      .render(["", "![[b.png]]", ""])
      .includes("texto enche linguica![[b.png]]"),
  );
});

test("HTML paste prefers matched clipboard files and reports inaccessible Gmail images", async () => {
  const file = new File(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
    "image.png",
  );
  const html = '<img src="https://mail.google.com/private-image">';
  requests.length = 0;
  assert.equal(await htmlImagePaste(html, [file])!.images[0].load(), file);
  assert.equal(requests.length, 0);
  await assert.rejects(htmlImagePaste(html, [])!.images[0].load(), /Gmail/);
  assert.equal(requests.length, 1);
});

test("HTML paste does not execute markup or request unsupported image protocols", async () => {
  requests.length = 0;
  for (const source of [
    "file:///secret.png",
    "cid:attachment",
    "blob:https://mail.google.com/image",
    "javascript:alert(1)",
  ]) {
    const result = htmlImagePaste(
      `<script>alert(1)</script><img src="${source}">text`,
      [],
    )!;
    await assert.rejects(result.images[0].load());
    assert.ok(!result.render(["![[a.png]]"]).includes("alert(1)"));
  }
  assert.equal(requests.length, 0);
  assert.equal(htmlImagePaste("<p>Plain text</p>", []), undefined);
});

test("image context menu suppresses the native menu, has icons and avoids ambiguous edits", async () => {
  const plugin = new VisualKit({} as never, {} as never);
  const imageFile = new TFile("a.png");
  const note = new TFile("note.md");
  let source = "![[a.png]]";
  const editor = {
    getValue: () => source,
    getCursor: () => ({ line: 0, ch: 2 }),
    posToOffset: () => 2,
  };
  const root = dom.document.createElement("div");
  root.innerHTML =
    '<span class="internal-embed" src="a.png"><img src="app://a.png"></span>';
  dom.document.body.append(root);
  const view = Object.assign(new MarkdownView(), {
    contentEl: root,
    file: note,
    editor,
  });
  const events = new Map<string, (...args: any[]) => void>();
  Object.assign(plugin, {
    app: {
      workspace: {
        on: (name: string, callback: (...args: any[]) => void) =>
          events.set(name, callback),
        iterateAllLeaves: (callback: (leaf: unknown) => void) =>
          callback({ view }),
        getActiveViewOfType: () => null,
      },
      vault: { on: () => {} },
      metadataCache: { getFirstLinkpathDest: () => imageFile },
    },
  });
  await plugin.onload();
  let nativeMenus = 0;
  root.addEventListener("contextmenu", () => nativeMenus++);
  const click = () =>
    root
      .querySelector("img")!
      .dispatchEvent(
        new dom.MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      );
  Menu.shown = [];
  click();
  assert.equal(nativeMenus, 0);
  assert.equal(Menu.shown.length, 1);
  const items = Menu.shown[0].items;
  assert.ok(items.every((item) => item.icon));
  assert.equal(items.filter((item) => item.title === "Resize").length, 1);
  const color = plugin.settings.color;
  items.find((item) => item.title === "Mark error")!.callback();
  assert.equal(plugin.settings.color, color);
  const editorMenu = new Menu();
  events.get("editor-menu")!(editorMenu, editor, { file: note });
  assert.equal(
    editorMenu.items.filter((item) => item.title === "Copy with images").length,
    1,
  );
  assert.equal(
    editorMenu.items.filter((item) => item.title === "Normalize note images")
      .length,
    1,
  );
  source = "![[a.png]]\n![[a.png]]";
  click();
  assert.ok(!Menu.shown[1].items.some((item) => item.title === "Resize"));
  root.remove();
});

test("editor raster export respects crop at arbitrary viewport zoom and reopens objects", async () => {
  const base = new StaticCanvas(undefined, { width: 100, height: 80 });
  base.add(
    new Rect({
      originX: "left",
      originY: "top",
      left: 0,
      top: 0,
      width: 100,
      height: 80,
      fill: "#00ff00",
      strokeWidth: 0,
    }),
  );
  const source = base.toDataURL();
  const canvas = new Canvas(undefined, { width: 200, height: 200 });
  const image = await FabricImage.fromURL(source);
  image.set({
    selectable: false,
    evented: false,
    originX: "left",
    originY: "top",
  });
  canvas.add(image);
  const view = new ImageEditorView(
    { app: {}, settings: { ...defaults }, persist: async () => {} } as never,
    new TFile("a.png") as never,
  ) as any;
  view.canvas = canvas;
  view.source = source;
  view.crop = { x: 10, y: 10, width: 50, height: 40 };
  view.snapshot();
  canvas.add(
    new Rect({
      originX: "left",
      originY: "top",
      left: 10,
      top: 10,
      width: 20,
      height: 20,
      fill: "#000000",
      strokeWidth: 0,
      data: "redaction",
    } as any),
  );
  view.snapshot();
  canvas.setViewportTransform([2, 0, 0, 2, -20, -20]);
  const url = view.export();
  const exported = await FabricImage.fromURL(url);
  assert.equal(exported.width, 50);
  assert.equal(exported.height, 40);
  const doc = parseAnnotation(JSON.stringify(view.data()));
  assert.equal((doc.canvas.objects as any[])[1].data, "redaction");
  await view.undo();
  assert.equal(canvas.getObjects().length, 1);
  await view.redo();
  assert.equal(canvas.getObjects().length, 2);
  const object = canvas.getObjects()[1];
  canvas.setActiveObject(object);
  view.opacity = 0.1;
  view.color = "#ffffff";
  view.applyProperties();
  assert.equal(object.opacity, 1);
  assert.equal(object.fill, "#000000");
  const check = new StaticCanvas(undefined, { width: 50, height: 40 });
  exported.set({ originX: "left", originY: "top" });
  check.add(exported);
  check.renderAll();
  assert.deepEqual(
    Array.from(check.getContext().getImageData(5, 5, 1, 1).data),
    [0, 0, 0, 255],
  );
  assert.deepEqual(
    Array.from(check.getContext().getImageData(35, 25, 1, 1).data),
    [0, 255, 0, 255],
  );
  await check.dispose();
  await canvas.dispose();
  await base.dispose();
});
test("rich export embeds local binary and sizes, writes both flavors, normalizes only output", async () => {
  const file = new TFile("a.png"),
    imageCanvas = dom.document.createElement("canvas");
  imageCanvas.width = 100;
  imageCanvas.height = 60;
  const bytes = Uint8Array.from(
    Buffer.from(imageCanvas.toDataURL().split(",")[1], "base64"),
  ).buffer;
  const app = {
    metadataCache: { getFirstLinkpathDest: () => file },
    vault: { readBinary: async () => bytes },
  };
  const markdown = "Before\n![[a.png|500x300]]\nAfter";
  await copyMarkdown(app as never, markdown, "note.md", { ...defaults });
  assert.match(clipboard.last.html, /data:image\/png;base64,/);
  assert.match(clipboard.last.html, /width="500"/);
  assert.match(clipboard.last.html, /height="300"/);
  assert.doesNotMatch(
    clipboard.last.html,
    /font-family|font-size|line-height|color\s*:/i,
  );
  assert.doesNotMatch(clipboard.last.html, /!\[\[|QRC[0-9a-f]/);
  assert.match(clipboard.last.text, /Before/);
  assert.match(clipboard.last.text, /After/);
  await copyMarkdown(app as never, markdown, "note.md", {
    ...defaults,
    normalizeCopy: true,
  });
  assert.match(clipboard.last.html, /width="600"/);
  assert.match(clipboard.last.html, /height="360"/);
  const outputImage = await loadImage(
    /src="([^"]+)"/.exec(clipboard.last.html)![1],
  );
  assert.equal(outputImage.width, 600);
  assert.equal(outputImage.height, 360);
  assert.doesNotMatch(clipboard.last.html, /<(div|p)[\s>]/);
  assert.doesNotMatch(clipboard.last.html, /height="300"/);
  assert.equal(markdown, "Before\n![[a.png|500x300]]\nAfter");
});

test("copy formatting flattens macro-breaking blocks and supports explicit macro typography", () => {
  const root = dom.document.createElement("div");
  root.innerHTML =
    "<h2>Heading</h2><p>First <strong>bold</strong></p><p>Second <code>code</code></p>";
  formatCopy(root, {
    ...defaults,
    copyFontFamily: "Arial",
    copyFontSize: "16",
    copyTextColor: "#123456",
  });
  assert.doesNotMatch(root.innerHTML, /<(h2|p|code)[\s>]/);
  assert.equal(root.querySelectorAll("br").length, 3);
  assert.equal(root.querySelector("strong")?.textContent, "bold");
  assert.equal(
    root.firstElementChild?.getAttribute("style"),
    "font-family: Arial; font-size: 16px; color: rgb(18, 52, 86);",
  );
  const plain = dom.document.createElement("div");
  plain.innerHTML = "<p><b>First</b></p><p><i>Second</i></p>";
  formatCopy(plain, { ...defaults, preserveFormatting: false });
  assert.equal(plain.innerHTML, "First<br>Second<br>");
});

test("image export rejects corrupt and oversized images before overwriting clipboard", async () => {
  const before = { ...clipboard.last };
  const app = {
    metadataCache: { getFirstLinkpathDest: () => new TFile("bad.png") },
    vault: { readBinary: async () => new Uint8Array([1, 2, 3]).buffer },
  };
  await assert.rejects(
    copyMarkdown(app as never, "![[bad.png]]", "note.md", defaults),
    /Clipboard unchanged/,
  );
  assert.deepEqual(clipboard.last, before);
  await assert.rejects(
    prepareCopyImage(new ArrayBuffer(1), "png", 0),
    /dimensions/,
  );
  await assert.rejects(prepareCopyImage(new ArrayBuffer(0), "png"), /empty/);
  await assert.rejects(prepareCopyImage(new ArrayBuffer(1), "svg"), /PNG/);
});

test("every setting has an explanation", () => {
  for (const key of Object.keys(defaults) as (keyof typeof defaults)[])
    assert.ok(settingDescriptions[key].length > 30, key);
});

test("PNG export bakes dimensions, retains aspect ratio, and can preserve original encoding", async () => {
  const source = dom.document.createElement("canvas");
  source.width = 100;
  source.height = 60;
  source.getContext("2d")!.fillRect(0, 0, 100, 60);
  const bytes = Uint8Array.from(
    Buffer.from(source.toDataURL("image/jpeg").split(",")[1], "base64"),
  ).buffer;
  const image = await prepareCopyImage(bytes, "jpg", 40);
  assert.match(image.source, /^data:image\/png;base64,/);
  const decoded = await loadImage(image.source);
  assert.deepEqual([decoded.width, decoded.height], [40, 24]);
  const stretched = await prepareCopyImage(bytes, "jpg", 40, 50);
  assert.deepEqual([stretched.width, stretched.height], [40, 50]);
  const original = await prepareCopyImage(bytes, "jpg", 40, undefined, false);
  assert.match(original.source, /^data:image\/jpeg;base64,/);
  assert.deepEqual(
    Buffer.from(original.source.split(",")[1], "base64"),
    Buffer.from(bytes),
  );
  await assert.rejects(
    prepareCopyImage(bytes, "jpg", 10000, 4000),
    /megapixel/,
  );
});

test("saved copy settings validate macro typography and numeric bounds", () => {
  const invalid = readStoredData({
    settings: {
      width: 90000,
      fontSize: 1,
      lineWidth: 1.5,
      copyFontSize: "999",
      copyTextColor: "red;",
    },
  }).settings;
  assert.equal(invalid.width, defaults.width);
  assert.equal(invalid.fontSize, defaults.fontSize);
  assert.equal(invalid.lineWidth, defaults.lineWidth);
  assert.equal(invalid.copyFontSize, "");
  assert.equal(invalid.copyTextColor, "");
  const valid = readStoredData({
    settings: {
      copyFontFamily: "Arial",
      copyFontSize: "16",
      copyTextColor: "#123456",
    },
  }).settings;
  assert.equal(valid.copyFontFamily, "Arial");
  assert.equal(valid.copyFontSize, "16");
  assert.equal(valid.copyTextColor, "#123456");
});
test("rich export fails before writing clipboard on missing and remote images", async () => {
  const before = { ...clipboard.last };
  const app = {
    metadataCache: { getFirstLinkpathDest: () => null },
    vault: {},
  };
  await assert.rejects(
    copyMarkdown(app as never, "![[missing.png]]", "note.md", defaults),
    /not found/,
  );
  await assert.rejects(
    copyMarkdown(
      app as never,
      "![](https://example.com/a.png)",
      "note.md",
      defaults,
    ),
    /External/,
  );
  await assert.rejects(
    copyMarkdown(
      app as never,
      "![](https://example.com/image)",
      "note.md",
      defaults,
    ),
    /Unsupported/,
  );
  assert.deepEqual(clipboard.last, before);
});

test("center-origin annotations retain drag coordinates for rectangles and arrows", async () => {
  const canvas = new Canvas(undefined, { width: 200, height: 200 });
  const view = new ImageEditorView(
    { app: {}, settings: { ...defaults }, persist: async () => {} } as never,
    new TFile("a.png") as never,
  ) as any;
  view.canvas = canvas;
  view.start = new Point(20, 30);
  canvas.getScenePoint = () => new Point(90, 70);
  view.tool = "rectangle";
  view.pointerMove({});
  assert.equal(view.preview.originX, "center");
  assert.equal(view.preview.getBoundingRect().left, 20);
  assert.equal(view.preview.getBoundingRect().top, 30);
  view.tool = "arrow";
  view.pointerMove({});
  const tail = view.preview.getPointByOrigin("left", "center");
  assert.ok(Math.abs(tail.x - 20) < 0.001);
  assert.ok(Math.abs(tail.y - 30) < 0.001);
  await canvas.dispose();
});
