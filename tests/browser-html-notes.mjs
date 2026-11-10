import { build } from "esbuild";
import { chromium } from "playwright";
import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { resolve } from "node:path";

const bundle = await build({
  entryPoints: ["tests/browser-harness.ts"],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  alias: {
    obsidian: resolve("tests/obsidian-mock.ts"),
    electron: resolve("tests/electron-mock.ts"),
  },
});
const browser = await chromium.launch({
  headless: true,
  ...(process.env.VISUAL_KIT_BROWSER_CHANNEL
    ? { channel: process.env.VISUAL_KIT_BROWSER_CHANNEL }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const network = [];
page.on("request", (request) => {
  if (/^https?:/.test(request.url())) network.push(request.url());
});
const ticket = await readFile("tests/fixtures/support-ticket.html", "utf8");
try {
  await page.setContent('<main id="host"></main>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.evaluate((source) => window.vkTest.mount(source), ticket);
  await page.waitForFunction(
    () => window.vkTest.editor.doc?.body.isContentEditable,
  );
  assert.equal(await page.evaluate(() => window.vkTest.model.source), ticket);
  assert.deepEqual(
    await page.evaluate(() => window.vkTest.model.safe.issues),
    [],
  );
  await page.evaluate(() => {
    const { editor } = window.vkTest,
      range = editor.doc.createRange();
    range.selectNodeContents(editor.doc.querySelector("strong"));
    editor.doc.getSelection().removeAllRanges();
    editor.doc.getSelection().addRange(range);
    editor.capture();
    editor.command("foreColor", "#008800");
    editor.command("underline");
  });
  assert.match(
    await page.evaluate(() => window.vkTest.model.source),
    /rgb\(0, 136, 0\)|#008800|#080/,
  );
  assert.match(
    await page.evaluate(() => window.vkTest.model.source),
    /rowspan="2"/,
  );
  assert.match(
    await page.evaluate(() => window.vkTest.model.source),
    /colspan="2"/,
  );
  assert.deepEqual(
    await page.evaluate(() => window.vkTest.model.safe.issues),
    [],
  );
  const selection = await page.evaluate(() =>
    window.vkTest.editor.selectedHtml(),
  );
  assert.match(selection, /customer/);
  assert.match(selection, /color|underline/);
  const baseline = await page.evaluate(() => window.vkTest.editor.html());
  await page.evaluate(() =>
    window.vkTest.editor.insert(
      '<span style="background-color:#ffff00">Inserted response</span><img src="https://tracker.invalid/pixel" onerror="window.evil=true"><script>window.evil=true</script>',
    ),
  );
  assert.match(
    await page.evaluate(() => window.vkTest.model.source),
    /Inserted response/,
  );
  assert.doesNotMatch(
    await page.evaluate(() => window.vkTest.model.source),
    /onerror|<script/,
  );
  assert.equal(await page.evaluate(() => window.evil), undefined);
  await page.evaluate(() => window.vkTest.editor.undo());
  assert.equal(
    await page.evaluate(() => window.vkTest.editor.html()),
    baseline,
  );
  await page.evaluate(() => window.vkTest.editor.undo(true));
  assert.match(
    await page.evaluate(() => window.vkTest.model.source),
    /Inserted response/,
  );
  await page.evaluate(() => window.vkTest.mount("<p>Typing test</p>"));
  await page.waitForFunction(
    () => window.vkTest.editor.doc?.body.isContentEditable,
  );
  const body = page.frameLocator("iframe").locator("body");
  await body.click();
  await body.press("Control+End");
  await page.keyboard.type(" native input");
  assert.match(
    await page.evaluate(() => window.vkTest.model.source),
    /native input/,
  );
  await body.press("Control+z");
  assert.doesNotMatch(
    await page.evaluate(() => window.vkTest.model.source),
    /native input<\/p>$/,
  );
  await page.evaluate(() =>
    window.vkTest.mount(
      '<p style="color:blue">Copy <b>this</b></p><img src="../attachments/a.png" width="480" height="270">',
    ),
  );
  await page.waitForFunction(
    () => window.vkTest.editor.doc?.body.isContentEditable,
  );
  await page.evaluate(() => {
    const { editor } = window.vkTest,
      range = editor.doc.createRange();
    range.selectNodeContents(editor.doc.querySelector("b"));
    editor.doc.getSelection().removeAllRanges();
    editor.doc.getSelection().addRange(range);
    editor.doc.dispatchEvent(
      new ClipboardEvent("copy", { bubbles: true, cancelable: true }),
    );
  });
  assert.match(await page.evaluate(() => window.vkTest.copied), /color:blue/);
  assert.match(
    await page.evaluate(() => window.vkTest.editor.html()),
    /src="\.\.\/attachments\/a.png"/,
  );
  assert.doesNotMatch(
    await page.evaluate(() => window.vkTest.editor.html()),
    /data-vk-source|data:image/,
  );
  await page.evaluate(() => {
    const { editor } = window.vkTest;
    editor.mutate((doc) => {
      const img = doc.querySelector("img");
      img.width = 240;
      img.style.width = "240px";
    });
  });
  assert.match(
    await page.evaluate(() => window.vkTest.model.source),
    /width="240"/,
  );
  await mkdir(".test-build", { recursive: true });
  await page.screenshot({
    path: ".test-build/html-editor-browser.png",
    fullPage: true,
  });
  await page.evaluate(() => {
    const view = window.vkTest.source();
    view.focus();
  });
  await page.locator(".cm-content").press("Control+End");
  await page.keyboard.type("<!-- source edit -->");
  assert.match(
    await page.evaluate(() => window.vkTest.model.source),
    /source edit/,
  );
  await page.addStyleTag({ content: await readFile("styles.css", "utf8") });
  const noImages = ticket.replace(/<img\b[^>]*>/g, "");
  await page.evaluate((source) => window.vkViewTest.mount(source), noImages);
  await page.frameLocator("iframe").locator("body").waitFor();
  assert.equal(await page.evaluate(() => window.vkViewTest.writes), 0);
  await page.frameLocator("iframe").locator("strong").click();
  await page.frameLocator("iframe").locator("body").press("Control+End");
  await page.keyboard.type(" Appended in view.");
  await page.waitForFunction(() =>
    window.vkViewTest.disk.includes("Appended in view."),
  );
  await page.getByRole("button", { name: "Source", exact: true }).click();
  // CodeMirror virtualizes offscreen lines; scroll before asserting rendered text.
  await page.locator(".cm-content").press("Control+End");
  await page.waitForFunction(() =>
    document
      .querySelector(".cm-content")
      ?.textContent.includes("Appended in view"),
  );
  assert.match(
    await page.locator(".cm-content").innerText(),
    /Appended in view/,
  );
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.waitForFunction(() =>
    document
      .querySelector("iframe")
      ?.contentDocument?.body?.textContent?.includes("Appended in view"),
  );
  assert.equal(
    await page
      .frameLocator("iframe")
      .locator("body")
      .getAttribute("contenteditable"),
    "false",
  );
  await page
    .getByRole("button", { name: "Copy whole note", exact: true })
    .click();
  await page.waitForFunction(() =>
    window.vkViewTest.clipboard.html.includes("Appended in view"),
  );
  await page.getByRole("button", { name: "Visual", exact: true }).click();
  await page.frameLocator("iframe").locator("body").click();
  await page.frameLocator("iframe").locator("body").press("Control+End");
  await page.keyboard.type(" Conflict edits");
  await page.evaluate(() =>
    window.vkViewTest.external("<p>Externally changed</p>"),
  );
  await page
    .getByRole("button", { name: "Save edits as copy", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Save edits as copy", exact: true })
    .click();
  await page.waitForFunction(() => window.vkViewTest.backups.length > 0);
  assert.equal(
    await page.evaluate(() => window.vkViewTest.disk),
    "<p>Externally changed</p>",
  );
  assert.match(
    await page.evaluate(() => window.vkViewTest.backups[0][1]),
    /Conflict edits/,
  );
  await page.screenshot({
    path: ".test-build/html-note-view-browser.png",
    fullPage: true,
  });
  await page.evaluate(() => window.vkViewTest.close());
  await page.evaluate(() =>
    window.vkViewTest.mount(
      "<p>Keep the source</p><script>window.evil=true</script>",
    ),
  );
  await page.locator(".cm-content").waitFor();
  assert.equal(await page.locator("iframe").count(), 0);
  assert.match(await page.locator(".cm-content").innerText(), /<script>/);
  assert.equal(await page.evaluate(() => window.vkViewTest.writes), 0);
  assert.deepEqual(network, []);

  await page.evaluate(() =>
    window.vkViewTest.mount(
      '<!doctype html><html><head><style>.cards{display:grid;grid-template-columns:1fr 1fr}h1{color:rgb(12, 34, 56)}</style></head><body><main class="cards"><h1>Styled preview</h1><p>Second column</p></main><script>window.evil=true</script></body></html>',
    ),
  );
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const fullFrame = page.frameLocator('iframe[title="Full HTML preview"]');
  await fullFrame.locator("h1").waitFor();
  assert.equal(
    await fullFrame.locator("h1").evaluate((el) => getComputedStyle(el).color),
    "rgb(12, 34, 56)",
  );
  assert.equal(
    await fullFrame
      .locator("main")
      .evaluate((el) => getComputedStyle(el).display),
    "grid",
  );
  assert.equal(await fullFrame.locator("script").count(), 0);
  assert.deepEqual(network, []);

  // Exercise the actual Chromium clipboard transport, including the extra
  // computed styles added when an ordinary editable element is copied.
  const clipboardContext = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  try {
    const clipboardPage = await clipboardContext.newPage();
    await clipboardPage.route("https://visual-kit.test/", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<main id="host"></main><div id="copy-source" contenteditable="true"></div>',
      }),
    );
    await clipboardPage.goto("https://visual-kit.test/");
    await clipboardPage.addScriptTag({ content: bundle.outputFiles[0].text });
    await clipboardPage.evaluate(() => window.vkViewTest.mount("<p><br></p>"));
    const editorBody = clipboardPage.frameLocator("iframe").locator("body");
    await editorBody.click();
    await clipboardPage.keyboard.type("aaaaaa");
    await editorBody.press("Control+a");
    await editorBody.press("Control+c");
    await clipboardPage.waitForFunction(() =>
      window.vkViewTest.clipboard.text.includes("aaaaaa"),
    );
    // The Electron mock records the application's rich copy; put that exact
    // payload on the OS clipboard so Ctrl+V uses native clipboard wrappers.
    await clipboardPage.evaluate(async () => {
      const { html, text } = window.vkViewTest.clipboard;
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
    });
    await editorBody.press("Control+End");
    await editorBody.press("Control+v");
    await clipboardPage.waitForFunction(() =>
      window.vkViewTest.disk.includes("aaaaaaaaaaaa"),
    );
    assert.deepEqual(
      await clipboardPage.evaluate(() => window.vkViewTest.backups),
      [],
    );
    assert.equal(await clipboardPage.locator(".modal").count(), 0);
    assert.equal(
      await clipboardPage.evaluate(() => window.vkViewTest.persists),
      0,
    );

    const nativeSource = clipboardPage.locator("#copy-source");
    await nativeSource.fill("aaaaaa");
    await nativeSource.press("Control+a");
    await nativeSource.press("Control+c");
    await clipboardPage.evaluate(() => window.vkViewTest.mount("<p><br></p>"));
    await editorBody.click();
    await editorBody.press("Control+v");
    await clipboardPage.waitForFunction(() =>
      window.vkViewTest.disk.includes("aaaaaa"),
    );
    assert.equal(await clipboardPage.locator(".modal").count(), 0);
    assert.deepEqual(
      await clipboardPage.evaluate(() => window.vkViewTest.backups),
      [],
    );
    assert.equal(
      await clipboardPage.evaluate(() => window.vkViewTest.persists),
      0,
    );

    await clipboardPage.evaluate(() => {
      const data = new DataTransfer();
      data.setData(
        "text/html",
        "<p><b>Safe paste</b><script>window.evil=true</script></p>",
      );
      document.querySelector("iframe").contentDocument.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          cancelable: true,
        }),
      );
    });
    await clipboardPage.waitForFunction(() =>
      window.vkViewTest.disk.includes("Safe paste"),
    );
    const pastedSource = await clipboardPage.evaluate(
      () => window.vkViewTest.disk,
    );
    assert.match(pastedSource, /<b>Safe paste<\/b>/);
    assert.doesNotMatch(pastedSource, /<script>|window.evil/);
    assert.deepEqual(
      await clipboardPage.evaluate(() => window.vkViewTest.backups),
      [],
    );
    assert.equal(await clipboardPage.locator(".modal").count(), 0);
  } finally {
    await clipboardContext.close();
  }
  console.log(
    "PASS: Chromium frame editing, formatting, spans, selection copy, typing, undo/redo, image references/resizing, source editing, script/network isolation; file-view autosave, mode switching, preview, whole-note copy, conflict recovery, unsafe-source fallback; native clipboard text and sanitized HTML paste without extra files or dialogs.",
  );
} finally {
  await browser.close();
}
