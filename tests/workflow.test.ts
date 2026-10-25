import { test } from "node:test";
import assert from "node:assert/strict";
import { TFile, Notice } from "./obsidian-mock";
import { DuplicateIndex } from "../src/duplicates/DuplicateIndex";
import { MultiImagePasteHandler } from "../src/paste/MultiImagePasteHandler";
import { defaults } from "../src/settings";
import { imageHash } from "../src/duplicates/ImageHasher";
const png = (last: number) =>
  new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, last]).buffer;
function fixture() {
  const files = new Map<string, TFile>(),
    bytes = new Map<string, ArrayBuffer>(),
    folders = new Set<string>();
  const note = new TFile("tickets/ticket-1500.md");
  let content = "",
    writes = 0;
  const app = {
    vault: {
      getFiles: () => Array.from(files.values()),
      getAbstractFileByPath: (p: string) =>
        files.get(p) || (folders.has(p) ? { path: p } : null),
      readBinary: async (f: TFile) => bytes.get(f.path)!,
      createFolder: async (p: string) => {
        folders.add(p);
      },
      createBinary: async (p: string, b: ArrayBuffer) => {
        if (files.has(p)) throw new Error("Already exists");
        const f = new TFile(p, b.byteLength);
        files.set(p, f);
        bytes.set(p, b);
        writes++;
        return f;
      },
      process: async (_f: TFile, fn: (s: string) => string) => {
        content = fn(content);
      },
    },
    workspace: { getActiveFile: () => note },
    metadataCache: { getFirstLinkpathDest: (p: string) => files.get(p) },
  };
  const editor = {
    getValue: () => content,
    getCursor: () => ({ line: 0, ch: 0 }),
    replaceRange: (text: string) => {
      content = text;
    },
  };
  const plugin = {
    app,
    settings: { ...defaults, pasteWidth: true, naming: "{note}-{counter}" },
    index: new DuplicateIndex(app as never),
    persist: async () => {},
  };
  return {
    app,
    plugin,
    note,
    editor,
    files,
    bytes,
    getContent: () => content,
    getWrites: () => writes,
    setContent: (s: string) => {
      content = s;
    },
  };
}
test("HTML paste keeps text and failure positions while saving available images", async () => {
  const f = fixture();
  const handler = new MultiImagePasteHandler(f.plugin as never);
  handler.paste(
    [
      {
        name: "unavailable",
        load: async () => {
          throw new Error("Authentication required");
        },
      },
      { name: "available", load: async () => new File([png(1)], "a.png") },
    ],
    f.editor as never,
    f.note as never,
    (embeds) => `${embeds[0] || "[Image not imported]"}\ntext\n${embeds[1]}`,
  );
  await (handler as unknown as { queue: Promise<void> }).queue;
  assert.equal(
    f.getContent(),
    "[Image not imported]\ntext\n![[attachments/ticket-1500-02.png|600]]",
  );
  assert.equal(f.getWrites(), 1);
});

test("acceptance: four images preserve order and default width; repeat paste reuses all", async () => {
  const f = fixture();
  const files = [1, 2, 3, 4].map(
    (i) => new File([png(i)], `image${i}.png`, { type: "image/png" }),
  );
  const handler = new MultiImagePasteHandler(f.plugin as never);
  handler.paste(files, f.editor as never, f.note as never);
  await (handler as unknown as { queue: Promise<void> }).queue;
  assert.equal(f.getWrites(), 4);
  assert.equal(
    f.getContent(),
    [1, 2, 3, 4]
      .map((i) => `![[attachments/ticket-1500-0${i}.png|600]]`)
      .join("\n\n"),
  );
  handler.paste(files, f.editor as never, f.note as never);
  await (handler as unknown as { queue: Promise<void> }).queue;
  assert.equal(f.getWrites(), 4);
});
test("duplicates inside same batch create only one file", async () => {
  const f = fixture(),
    handler = new MultiImagePasteHandler(f.plugin as never);
  handler.paste(
    [1, 1].map((i) => new File([png(i)], "a.png")),
    f.editor as never,
    f.note as never,
  );
  await (handler as unknown as { queue: Promise<void> }).queue;
  assert.equal(f.getWrites(), 1);
  assert.equal(f.getContent().split("ticket-1500-01.png").length, 3);
});
test("partial failure retains successful images and names failed item", async () => {
  const f = fixture(),
    handler = new MultiImagePasteHandler(f.plugin as never);
  handler.paste(
    [
      new File([png(1)], "valid.png"),
      new File(["invalid"], "broken.png"),
      new File([png(3)], "last.png"),
    ],
    f.editor as never,
    f.note as never,
  );
  await (handler as unknown as { queue: Promise<void> }).queue;
  assert.equal(f.getWrites(), 2);
  assert.match(f.getContent(), /ticket-1500-03.png/);
  assert.ok(
    Notice.messages.some(
      (m) => m.includes("broken.png") && m.includes("1 failed"),
    ),
  );
});
test("always save still generates collision-free names", async () => {
  const f = fixture();
  f.plugin.settings.duplicateAction = "save";
  const handler = new MultiImagePasteHandler(f.plugin as never),
    file = new File([png(1)], "a.png");
  for (let i = 0; i < 2; i++) {
    handler.paste([file], f.editor as never, f.note as never);
    await (handler as unknown as { queue: Promise<void> }).queue;
  }
  assert.equal(f.getWrites(), 2);
  assert.ok(f.files.has("attachments/ticket-1500-01-1.png"));
});
test("cache is revalidated even when size and modification time match", async () => {
  const f = fixture(),
    file = await f.app.vault.createBinary("attachments/a.png", png(1));
  await f.plugin.index.update(file as never);
  const hash = await imageHash(png(1));
  f.bytes.set(file.path, png(2));
  assert.equal(
    (await f.plugin.index.find(hash, "attachments", f.note.path, [])).length,
    0,
  );
});
test("missing cache entries are discovered and attachments ranked first", async () => {
  const f = fixture();
  await f.app.vault.createBinary("archive/a.png", png(1));
  await f.app.vault.createBinary("attachments/b.png", png(1));
  const matches = await f.plugin.index.find(
    await imageHash(png(1)),
    "attachments",
    f.note.path,
    ["archive/a.png"],
  );
  assert.equal(matches[0].path, "attachments/b.png");
  f.files.delete("attachments/b.png");
  assert.equal(
    (
      await f.plugin.index.find(
        await imageHash(png(1)),
        "attachments",
        f.note.path,
        [],
      )
    ).length,
    1,
  );
});
test("paste does not overwrite text changed during processing", async () => {
  const f = fixture(),
    handler = new MultiImagePasteHandler(f.plugin as never);
  handler.paste(
    [new File([png(1)], "a.png")],
    f.editor as never,
    f.note as never,
  );
  f.setContent("New edits");
  await (handler as unknown as { queue: Promise<void> }).queue;
  assert.ok(f.getContent().startsWith("New edits\n\n"));
});

test("disabled duplicate detection performs no hash indexing during paste", async () => {
  const f = fixture();
  f.plugin.settings.duplicates = false;
  f.plugin.index.update = async () => {
    throw new Error("Indexing must not run when disabled");
  };
  f.plugin.index.find = async () => {
    throw new Error("Duplicate matching must not run when disabled");
  };
  const handler = new MultiImagePasteHandler(f.plugin as never);
  handler.paste(
    [new File([png(1)], "image.png")],
    f.editor as never,
    f.note as never,
  );
  await (handler as unknown as { queue: Promise<void> }).queue;
  assert.equal(f.getWrites(), 1);
  assert.match(f.getContent(), /ticket-1500-01.png/);
});
