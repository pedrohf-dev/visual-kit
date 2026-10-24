import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { Canvas, StaticCanvas, Rect, FabricImage } from "fabric";
import { ImageEditorView } from "../src/editor/ImageEditorView";
import { defaults } from "../src/settings";
import { TFile } from "./obsidian-mock";
import { clipboard } from "./electron-mock";
import { copyMarkdown } from "../src/clipboard/HtmlClipboard";
import { parseAnnotation } from "../src/editor/persistence/AnnotationSerializer";

const { window: dom } = new JSDOM();
Object.assign(globalThis, {
  document: dom.document,
  NodeFilter: dom.NodeFilter,
  HTMLAnchorElement: dom.HTMLAnchorElement,
  HTMLImageElement: dom.HTMLImageElement,
});
test("editor raster export respects crop at arbitrary viewport zoom and reopens objects", async () => {
  const base = new StaticCanvas(undefined, { width: 100, height: 80 });
  base.add(
    new Rect({
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
  image.set({ selectable: false, evented: false });
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
    bytes = new Uint8Array([137, 80, 78, 71]).buffer;
  const app = {
    metadataCache: { getFirstLinkpathDest: () => file },
    vault: { readBinary: async () => bytes },
  };
  const markdown = "Before\n![[a.png|500x300]]\nAfter";
  await copyMarkdown(app as never, markdown, "note.md", { ...defaults });
  assert.match(clipboard.last.html, /data:image\/png;base64,/);
  assert.match(clipboard.last.html, /width="500"/);
  assert.match(clipboard.last.html, /height="300"/);
  assert.doesNotMatch(clipboard.last.html, /!\[\[|QRC[0-9a-f]/);
  assert.match(clipboard.last.text, /Before/);
  assert.match(clipboard.last.text, /After/);
  await copyMarkdown(
    app as never,
    markdown,
    "note.md",
    { ...defaults, normalizeCopy: true },
    true,
  );
  assert.match(clipboard.last.html, /width="600"/);
  assert.doesNotMatch(clipboard.last.html, /height="300"/);
  assert.equal(markdown, "Before\n![[a.png|500x300]]\nAfter");
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
