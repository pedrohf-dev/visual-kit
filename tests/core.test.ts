import { test } from "node:test";
import assert from "node:assert/strict";
import { parseImages } from "../src/sizing/ImageEmbedParser";
import { normalizeImages } from "../src/sizing/ImageSizeNormalizer";
import { imageName, imageFolder } from "../src/paste/ImageNamingService";
import { imageHash } from "../src/duplicates/ImageHasher";
import { HistoryManager } from "../src/editor/history/HistoryManager";
import { parseAnnotation } from "../src/editor/persistence/AnnotationSerializer";
import { readImage } from "../src/paste/ClipboardImageReader";

test("normalizes all supported syntaxes while removing explicit heights", () => {
  assert.equal(
    normalizeImages(
      "![[a.png]]\n![[b.jpg|400]]\n![[c.webp|400x300]]\n![](d.png)",
      600,
    ),
    "![[a.png|600]]\n![[b.jpg|600]]\n![[c.webp|600]]\n![600](d.png)",
  );
});
test("preserves height only when configured", () =>
  assert.equal(
    normalizeImages("![[a.png|200x100]]", 600, true),
    "![[a.png|600x100]]",
  ));
test("does not touch other embeds or code", () => {
  const text =
    "![[doc.pdf]] ![[note]] ![[sound.mp3]] ![[video.mp4]] ![[board.canvas]]\n`![[a.png]]`\n```md\n![[a.png]]\n```\n    ![[a.png]]";
  assert.equal(normalizeImages(text, 600), text);
});
test("unclosed fences and escaped embeds remain untouched", () => {
  const text = "\\![[a.png]]\n~~~md\n![[b.png]]";
  assert.equal(normalizeImages(text, 600), text);
});
test("markdown handles spaces, nested parentheses, title and alt text", () =>
  assert.equal(
    normalizeImages(
      '![shot](<path/a b.png> "title")\n![x](path/a(b).png)',
      400,
    ),
    '![shot|400](<path/a b.png> "title")\n![x|400](path/a(b).png)',
  ));
test("Original removes sizes without losing descriptions", () =>
  assert.equal(
    normalizeImages("![[a.png|caption|600x400]]\n![caption|600](a.png)"),
    "![[a.png|caption]]\n![caption](a.png)",
  ));
test("invalid widths rejected", () => {
  for (const width of [0, -1, Infinity, NaN, 1.5, 16385])
    assert.throws(() => normalizeImages("![[a.png]]", width));
});
test("offsets identify exact source spans", () => {
  const source = "á\n![[a.png|600]]\n![b](x.jpg)";
  for (const e of parseImages(source))
    assert.equal(source.slice(e.start, e.end), e.raw);
});
test("naming expands date note counter and sanitizes", () =>
  assert.equal(
    imageName(
      "{note}-{date}-{counter}",
      "ticket:1500",
      4,
      "png",
      new Date(2026, 9, 24),
    ),
    "ticket-1500-2026-10-24-04.png",
  ));
test("folder resolution prevents escaping the vault", () => {
  assert.equal(
    imageFolder("attachments/{note}/", "a:b", "tickets"),
    "attachments/a-b",
  );
  assert.equal(imageFolder("same-folder", "x", "tickets"), "tickets");
  for (const folder of ["../outside", "/root", "C:\\tmp", "a/../b"])
    assert.throws(() => imageFolder(folder, "x", ""));
});
test("SHA-256 exact content matches; modified bytes differ", async () => {
  const bytes = new TextEncoder().encode("abc").buffer;
  assert.equal(
    await imageHash(bytes),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.notEqual(
    await imageHash(bytes),
    await imageHash(new TextEncoder().encode("abd").buffer),
  );
});
test("history undo redo and branching preserve state", () => {
  const h = new HistoryManager<{ v: number }>();
  h.push({ v: 1 });
  h.push({ v: 2 });
  h.push({ v: 2 });
  assert.deepEqual(h.undo(), { v: 1 });
  assert.deepEqual(h.redo(), { v: 2 });
  h.undo();
  h.push({ v: 3 });
  assert.equal(h.redo(), null);
  assert.deepEqual(h.undo(), { v: 1 });
});
test("history limit bounds memory", () => {
  const h = new HistoryManager<number>(2);
  h.push(1);
  h.push(2);
  h.push(3);
  assert.equal(h.undo(), 2);
  assert.equal(h.undo(), null);
});
test("sidecar rejects external resources and malformed crop", () => {
  const data = {
    version: 1,
    source: "data:image/png;base64,YQ==",
    canvas: { objects: [] },
    crop: { x: 0, y: 0, width: 100, height: 50 },
    nextMarker: 1,
  };
  assert.deepEqual(parseAnnotation(JSON.stringify(data)), data);
  assert.throws(() =>
    parseAnnotation(
      JSON.stringify({
        ...data,
        canvas: { objects: [{ src: "https://example.com/a.png" }] },
      }),
    ),
  );
  assert.throws(() =>
    parseAnnotation(
      JSON.stringify({ ...data, crop: { x: 0, y: 0, width: -1, height: 50 } }),
    ),
  );
});
test("paste validates bytes instead of trusting MIME", async () => {
  await assert.rejects(
    readImage(new File(["not an image"], "a.png", { type: "image/png" })),
  );
  const f = new File(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
    "a.png",
    { type: "image/png" },
  );
  assert.equal((await readImage(f)).extension, "png");
});
