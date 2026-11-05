// Editable feature artwork. Run: npm run assets:readme
// One headline anchors the layout; the document is secondary and the feature
// index stays subordinate. Safe margins: 112 px on a 1800 x 1120 canvas.
const fs = require("node:fs/promises");
const path = require("node:path");
const { createCanvas, loadImage } = require("canvas");
const OUT = path.join(__dirname, "../docs/community-assets");
const W = 1800,
  H = 1120;
const C = {
  bg: "#111116",
  ink: "#f5f3fa",
  muted: "#a8a5b7",
  purple: "#b49aff",
  line: "#31303c",
  panel: "#1c1b25",
  green: "#94d8b2",
};
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const measure = createCanvas(1, 1).getContext("2d");
function text(
  x,
  y,
  value,
  size = 22,
  fill = C.ink,
  weight = 400,
  maxWidth = 1600,
  extra = "",
) {
  measure.font = `${weight} ${size}px Arial`;
  if (measure.measureText(value).width > maxWidth)
    throw new Error(`Text overflows its zone: ${value}`);
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" ${extra}>${esc(value)}</text>`;
}
const rect = (x, y, w, h, fill, stroke = "none", r = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x1, y1, x2, y2, stroke = C.line, width = 1) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${stroke}" stroke-width="${width}" fill="none"/>`;
const icon = (name, x, y, color = C.purple) => {
  const paths = {
    stack:
      '<rect x="7" y="2" width="20" height="23" rx="3"/><rect x="2" y="7" width="20" height="23" rx="3"/>',
    paste:
      '<path d="M9 5H5v25h23V5h-5"/><rect x="9" y="1" width="14" height="8" rx="2"/><path d="M10 16h13M10 22h8"/>',
    annotate: '<path d="M5 26l2-8L24 1l7 7-17 17-9 1zM20 5l7 7M5 31h25"/>',
    html: '<path d="M9 7L1 16l8 9M23 7l8 9-8 9M19 3l-6 26"/>',
    size: '<rect x="3" y="10" width="26" height="18" rx="2"/><path d="M3 3h26M3 0v6M29 0v6M16 15v8M12 19h8"/>',
    reuse:
      '<path d="M25 7A12 12 0 0 0 4 14M25 1v7h-7M6 25a12 12 0 0 0 22-7M6 31v-7h7"/>',
    copy: '<rect x="10" y="8" width="20" height="23" rx="3"/><path d="M22 8V1H2v23h8M15 15h10M15 21h10"/>',
  };
  return `<g transform="translate(${x} ${y})" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">${paths[name]}</g>`;
};

function editor() {
  const x = 928,
    y = 173,
    w = 760;
  let out = `<g filter="url(#shadow)">${rect(x, y, w, 529, C.panel, C.line, 18)}</g>`;
  out +=
    icon("html", x + 23, y + 21, C.purple) +
    text(x + 72, y + 46, "support-response.html", 22, C.ink, 400, 420);
  out +=
    rect(x + w - 117, y + 20, 92, 31, "#30263f", "#554267", 6) +
    text(
      x + w - 71,
      y + 42,
      "HTML",
      16,
      C.purple,
      700,
      80,
      'text-anchor="middle"',
    );
  out += line(x, y + 69, x + w, y + 69);
  out +=
    rect(x + 18, y + 82, 84, 33, "#393044", "none", 6) +
    text(x + 60, y + 105, "Visual", 17, C.ink, 700, 80, 'text-anchor="middle"');
  out +=
    text(x + 124, y + 105, "Source", 17, C.muted, 400, 110) +
    text(x + 215, y + 105, "Preview", 17, C.muted, 400, 110);
  out +=
    rect(x + w - 181, y + 82, 159, 33, "#b49aff", "none", 6) +
    text(
      x + w - 101,
      y + 105,
      "Copy whole note",
      16,
      "#191322",
      700,
      148,
      'text-anchor="middle"',
    );
  out += line(x + 20, y + 130, x + w - 20, y + 130);
  out +=
    text(x + 28, y + 162, "B", 21, C.ink, 700, 35) +
    text(x + 72, y + 162, "I", 21, C.ink, 400, 35, 'font-style="italic"') +
    text(
      x + 108,
      y + 162,
      "U",
      21,
      C.ink,
      400,
      35,
      'text-decoration="underline"',
    );
  out +=
    line(x + 148, y + 143, x + 148, y + 167) +
    text(x + 169, y + 161, "Paragraph", 17, C.muted, 400, 135);
  out +=
    rect(x + 307, y + 145, 18, 18, "#b49aff", "none", 3) +
    rect(x + 343, y + 145, 18, 18, "#e6d575", "none", 3);
  out +=
    text(x + 394, y + 162, "Table", 17, C.muted, 400, 100) +
    text(x + 475, y + 162, "Image", 17, C.muted, 400, 95);
  out += rect(
    x + 19,
    y + 184,
    w - 38,
    323,
    "faf9f6".replace(/^/, "#"),
    "none",
    8,
  );
  out += text(
    x + 47,
    y + 228,
    "Export troubleshooting",
    27,
    "#25212e",
    700,
    660,
  );
  out += text(
    x + 47,
    y + 265,
    "The highlighted row shows the failure.",
    21,
    "#514b5c",
    400,
    650,
  );
  // A diagram of annotated screenshot evidence within the rich HTML document.
  out += rect(x + 47, y + 286, 628, 157, "#eeecf4", "#d8d4e4", 8);
  out += text(
    x + 64,
    y + 313,
    "EXPORT HISTORY",
    13,
    "#777083",
    700,
    200,
    'letter-spacing="1.4"',
  );
  out += line(x + 63, y + 327, x + 658, y + 327, "#d5d0df");
  out +=
    text(x + 65, y + 352, "ticket-summary.pdf", 17, "#3a3545", 400, 260) +
    text(x + 477, y + 352, "Completed", 16, "#386b50", 700, 150);
  out += text(x + 65, y + 395, "evidence.zip", 17, "#3a3545", 400, 260);
  out +=
    rect(x + 459, y + 370, 176, 37, "none", "#ce4c6a", 4) +
    text(x + 477, y + 395, "Failed to export", 16, "#a43754", 700, 155);
  out += `<path d="M${x + 379} ${y + 413}L${x + 449} ${y + 389}M${x + 436} ${y + 386}l13 3-7 11" stroke="#ce4c6a" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x + 361}" cy="${y + 419}" r="15" fill="#8c65dd"/>`;
  out += text(
    x + 361,
    y + 425,
    "1",
    17,
    "#ffffff",
    700,
    25,
    'text-anchor="middle"',
  );
  out +=
    rect(x + 47, y + 463, 204, 25, "#e8defa", "none", 3) +
    text(
      x + 54,
      y + 481,
      "Next step: retry the export",
      15,
      "#55406f",
      400,
      205,
    );
  out += text(
    x + w - 19,
    y + 554,
    "Illustrative workflow",
    15,
    C.muted,
    400,
    240,
    'text-anchor="end"',
  );
  return out;
}

async function main() {
  let art = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc"><title id="title">Visual Kit by pedrof — screenshots and rich text, ready to share</title><desc id="desc">Seven tools for Obsidian: batch paste, rich paste, annotations, HTML notes, image sizing, deduplication and rich copy. An illustrative HTML note combines formatted text and an annotated screenshot.</desc><defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.26"/></filter></defs>`;
  art += rect(0, 0, W, H, C.bg);
  art +=
    rect(112, 75, 43, 43, "#2b223a", "#5a4479", 11) +
    `<path d="M122 87l11 20 11-20" stroke="#c4abff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  art +=
    text(172, 106, "Visual Kit", 30, C.ink, 700, 350) +
    text(1688, 104, "by pedrof", 23, C.muted, 400, 300, 'text-anchor="end"');
  art += text(
    112,
    208,
    "FOR OBSIDIAN DESKTOP",
    17,
    C.purple,
    700,
    650,
    'letter-spacing="2.6"',
  );
  art += text(
    108,
    309,
    "Your evidence.",
    83,
    C.ink,
    700,
    790,
    'letter-spacing="-3"',
  );
  art += text(
    108,
    407,
    "Ready to share.",
    83,
    C.purple,
    700,
    790,
    'letter-spacing="-3"',
  );
  art += text(
    112,
    469,
    "Screenshot tools and HTML notes.",
    27,
    C.muted,
    400,
    755,
  );
  art += text(
    112,
    511,
    "One local workflow in your vault.",
    27,
    C.muted,
    400,
    755,
  );
  art +=
    `<circle cx="120" cy="566" r="5" fill="${C.green}"/>` +
    text(137, 573, "Local processing. No accounts.", 20, C.green, 400, 650);
  art += editor();
  art +=
    line(112, 756, 1688, 756) +
    text(112, 805, "From capture to clipboard.", 26, C.ink, 700, 700);
  const features = [
    ["stack", "Batch paste", "Multiple images, in order."],
    ["paste", "Rich paste", "Keep text and image order."],
    ["annotate", "Annotate", "Mark, explain, redact."],
    ["html", "HTML notes", "Visual · Source · Preview"],
    ["size", "Normalize sizes", "Consistent image widths."],
    ["reuse", "Deduplicate", "Reuse matching images."],
    ["copy", "Rich copy", "Text + images, copied together."],
  ];
  for (const [index, [name, label, copy]] of features.entries()) {
    const x = 112 + (index % 4) * 394,
      y = 847 + Math.floor(index / 4) * 96;
    art +=
      icon(name, x, y + 1) +
      text(x + 49, y + 25, label, 28, C.ink, 700, 330) +
      text(x, y + 61, copy, 24, C.muted, 400, 367);
  }
  art +=
    line(112, 1051, 1688, 1051) +
    text(
      112,
      1087,
      "Capture. Annotate. Keep the context.",
      18,
      C.muted,
      400,
      1000,
    );
  art +=
    text(
      1688,
      1087,
      "Visual Kit by pedrof",
      18,
      C.muted,
      400,
      400,
      'text-anchor="end"',
    ) + "</svg>";
  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, "visual-kit-overview.svg"), art);
  const canvas = createCanvas(W, H);
  canvas.getContext("2d").drawImage(await loadImage(Buffer.from(art)), 0, 0);
  await fs.writeFile(
    path.join(OUT, "visual-kit-overview.png"),
    canvas.toBuffer("image/png"),
  );
  await fs.mkdir(path.join(__dirname, "../.test-build"), { recursive: true });
  const thumb = createCanvas(900, 560);
  thumb.getContext("2d").drawImage(canvas, 0, 0, 900, 560);
  await fs.writeFile(
    path.join(__dirname, "../.test-build/readme-overview-review.png"),
    thumb.toBuffer("image/png"),
  );
  console.log(`Created SVG + PNG: ${W} x ${H}; checked every text zone.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
