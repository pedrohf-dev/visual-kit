// Deterministic vector artwork. Uses the canvas package already in the dev tree.
// Run: node scripts/generate-community-assets.cjs
const fs = require("node:fs/promises");
const path = require("node:path");
const { createCanvas, loadImage } = require("canvas");
const OUT = path.join(__dirname, "../docs/community-assets");
const C = {
  bg: "#151515",
  surface: "#1c1c1c",
  border: "#303030",
  text: "#f1f1f1",
  muted: "#a6a6a6",
  purple: "#a78bfa",
  accent: "#8b5cf6",
  green: "#48c774",
  red: "#ef5b67",
};
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const rect = (x, y, w, h, fill = C.surface, stroke = C.border, r = 12) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x1, y1, x2, y2, color = C.border, width = 2) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const text = (
  x,
  y,
  value,
  size = 22,
  color = C.muted,
  weight = 400,
  extra = "",
) =>
  `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" ${extra}>${esc(value)}</text>`;
const arrow = (x, y, vertical = false) =>
  vertical
    ? line(x, y, x, y + 35, "#666666") +
      `<path d="M${x - 6} ${y + 29}l6 6 6-6" fill="none" stroke="#666666" stroke-width="2"/>`
    : line(x, y, x + 35, y, "#666666") +
      `<path d="M${x + 29} ${y - 6}l6 6-6 6" fill="none" stroke="#666666" stroke-width="2"/>`;
function artwork(x, y, w, h, variant = 0) {
  const id = `crop-${x}-${y}-${w}-${h}`;
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/></clipPath></defs><g clip-path="url(#${id})">${rect(x, y, w, h, "#242127", "none", 7)}<circle cx="${x + w * 0.73}" cy="${y + h * 0.28}" r="${Math.min(w, h) * 0.11}" fill="${variant === 1 ? "#88818f" : C.purple}"/><path d="M${x} ${y + h}L${x + w * 0.32} ${y + h * 0.38}L${x + w * 0.64} ${y + h}Z" fill="${variant === 2 ? "#504757" : "#39303f"}"/><path d="M${x + w * 0.32} ${y + h}L${x + w * 0.72} ${y + h * 0.52}L${x + w} ${y + h * 0.85}V${y + h}Z" fill="#655276"/></g>`;
}
function card(x, y, n) {
  return (
    rect(x, y, 270, 145) +
    artwork(x + 14, y + 14, 242, 89, n - 1) +
    text(x + 16, y + 126, `0${n}`, 18, C.muted, 400) +
    line(x + 50, y + 120, x + 145, y + 120, "#414141", 5)
  );
}
function batch() {
  return (
    card(654, 188, 1) +
    card(706, 230, 2) +
    card(758, 272, 3) +
    arrow(891, 432, true) +
    rect(680, 488, 420, 148) +
    text(702, 519, "Note", 20, C.text, 700) +
    [0, 1, 2]
      .map(
        (i) =>
          artwork(702 + i * 126, 537, 112, 60, i) +
          text(708 + i * 126, 585, String(i + 1), 18, C.text, 700),
      )
      .join("")
  );
}
function annotate() {
  return (
    rect(650, 220, 486, 354) +
    rect(675, 245, 436, 304, "#202020", "none", 8) +
    line(705, 278, 845, 278, "#414141", 8) +
    line(705, 303, 1035, 303, "#333333", 6) +
    rect(831, 334, 210, 86, "none", C.red, 5) +
    `<path d="M831 334h210v86H831Z" fill="none" stroke="${C.red}" stroke-width="3"/>` +
    rect(848, 354, 118, 16, "#3a3333", "none", 3) +
    rect(848, 382, 165, 12, "#3a3333", "none", 3) +
    `<path d="M735 446L811 385M790 388l21-3-5 21" fill="none" stroke="${C.red}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="716" cy="465" r="22" fill="${C.accent}"/>` +
    text(716, 473, "1", 24, C.text, 700, 'text-anchor="middle"') +
    rect(855, 454, 182, 43, "#302a3b", "#4d3e69", 6) +
    text(872, 483, "Check this", 22, C.purple, 400) +
    rect(704, 511, 216, 15, "#6b5b28", "none", 3) +
    line(711, 518, 905, 518, "#a99456", 3)
  );
}
function normalize() {
  return (
    text(650, 256, "Before", 21, C.muted) +
    text(953, 256, "After", 21, C.purple) +
    [160, 78, 119]
      .map(
        (w, i) =>
          rect(650, 289 + i * 78, w, 37, "#292929", "#414141", 6) +
          text(825, 315 + i * 78, [820, 400, 610][i], 20, C.muted),
      )
      .join("") +
    arrow(885, 386) +
    [0, 1, 2]
      .map(
        (i) =>
          rect(953, 289 + i * 78, 125, 37, "#30263e", "#674d8d", 6) +
          text(1092, 315 + i * 78, "600", 20, C.purple),
      )
      .join("") +
    line(953, 537, 1078, 537, C.purple) +
    line(953, 532, 953, 542, C.purple) +
    line(1078, 532, 1078, 542, C.purple) +
    text(1016, 576, "600 px", 20, C.muted, 400, 'text-anchor="middle"')
  );
}
function deduplicate() {
  const inputs = [0, 1, 2]
    .map(
      (i) =>
        rect(650, 223 + i * 115, 184, 88) +
        artwork(662, 235 + i * 115, 72, 64) +
        text(748, 272 + i * 115, "Image A", 19, C.muted),
    )
    .join("");
  return (
    inputs +
    `<path d="M848 267h32v115h46M848 382h78M848 497h32V382" fill="none" stroke="#505050" stroke-width="2"/><path d="M918 376l8 6-8 6" fill="none" stroke="#505050" stroke-width="2"/>` +
    rect(950, 277, 186, 207, "#1c1c1c", "#48404f") +
    artwork(965, 292, 156, 110) +
    text(1043, 440, "Existing image", 19, C.text, 400, 'text-anchor="middle"') +
    `<path d="M974 516l6 6 12-14" fill="none" stroke="${C.green}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    text(1003, 524, "Reused", 21, C.green)
  );
}
function document(x, y) {
  return (
    rect(x, y, 198, 307) +
    text(x + 22, y + 45, "Title", 25, C.text, 700) +
    line(x + 22, y + 68, x + 158, y + 68, "#414141", 2) +
    line(x + 22, y + 95, x + 169, y + 95, "#676767", 5) +
    line(x + 22, y + 113, x + 131, y + 113, "#464646", 5) +
    artwork(x + 22, y + 139, 154, 93) +
    line(x + 22, y + 259, x + 167, y + 259, "#676767", 5) +
    line(x + 22, y + 277, x + 119, y + 277, "#464646", 5)
  );
}
function richCopy() {
  return document(650, 257) + arrow(875, 410) + document(938, 257);
}
const pieces = [
  {
    slug: "01-batch-paste",
    label: "Batch paste",
    lines: [
      [
        ["Paste ", false],
        ["multiple", true],
      ],
      [["images at once.", false]],
    ],
    copy: [
      "Paste several screenshots in one action",
      "and keep their original order.",
    ],
    name: "Batch Paste",
    draw: batch,
  },
  {
    slug: "02-annotate",
    label: "Annotations",
    lines: [
      [["Mark what", false]],
      [
        ["matters", true],
        [".", false],
      ],
    ],
    copy: ["Add arrows, shapes, text and markers", "without leaving Obsidian."],
    name: "Annotations",
    draw: annotate,
  },
  {
    slug: "03-normalize",
    label: "Image sizes",
    lines: [
      [["One size.", false]],
      [
        ["Every image", true],
        [".", false],
      ],
    ],
    copy: ["Normalize every image in a note", "with a single action."],
    name: "Normalize",
    draw: normalize,
  },
  {
    slug: "04-deduplicate",
    label: "Duplicates",
    lines: [
      [["Keep one.", false]],
      [
        ["Reuse it", true],
        [".", false],
      ],
    ],
    copy: [
      "Detect identical images and reuse",
      "the existing file automatically.",
    ],
    name: "Deduplicate",
    draw: deduplicate,
  },
  {
    slug: "05-rich-copy",
    label: "Rich copy",
    lines: [
      [["Copy everything", false]],
      [
        ["together", true],
        [".", false],
      ],
    ],
    copy: ["Copy formatted text and images", "as a single rich document."],
    name: "Rich Copy",
    draw: richCopy,
  },
];
async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const measure = createCanvas(1, 1).getContext("2d");
  for (const [i, p] of pieces.entries()) {
    const size = 62;
    measure.font = `700 ${size}px Arial`;
    for (const l of p.lines)
      if (measure.measureText(l.map((s) => s[0]).join("")).width > 535)
        throw new Error(`Headline overflows: ${p.slug}`);
    const headline = p.lines
      .map(
        (l, n) =>
          `<text x="64" y="${298 + n * 72}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" letter-spacing="-1.6" xml:space="preserve">${l.map(([s, a]) => `<tspan fill="${a ? C.purple : C.text}">${esc(s)}</tspan>`).join("")}</text>`,
      )
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-labelledby="title desc"><title id="title">Visual Kit — ${p.name}</title><desc id="desc">${p.lines.map((l) => l.map((s) => s[0]).join("")).join(" ")} ${p.copy.join(" ")}</desc>${rect(0, 0, 1200, 800, C.bg, "none", 0)}${text(1136, 84, "Visual Kit", 21, C.muted, 700, 'text-anchor="end"')}${text(64, 209, p.label, 21, C.purple, 400)}${headline}${p.copy.map((s, j) => text(64, 426 + j * 32, s, 23, C.muted)).join("")}${p.draw()}${rect(64, 696, 44, 44, "#30233e", "#4d366c", 10)}${text(86, 726, String(i + 1), 23, C.purple, 700, 'text-anchor="middle"')}${text(124, 726, p.name, 22, C.text, 700)}</svg>`;
    await fs.writeFile(path.join(OUT, p.slug + ".svg"), svg);
    const img = await loadImage(Buffer.from(svg));
    const canvas = createCanvas(1200, 800);
    canvas.getContext("2d").drawImage(img, 0, 0);
    const png = canvas.toBuffer("image/png");
    await fs.writeFile(path.join(OUT, p.slug + ".png"), png);
    if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 800)
      throw new Error("Invalid PNG dimensions");
    console.log(`${p.slug}: SVG + PNG, 1200 x 800`);
  }
  // A temporary review sheet is not part of the five deliverables.
  const sheet = createCanvas(1200, 800),
    ctx = sheet.getContext("2d");
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, 1200, 800);
  for (const [i, p] of pieces.entries())
    ctx.drawImage(
      await loadImage(path.join(OUT, p.slug + ".png")),
      (i % 3) * 400,
      Math.floor(i / 3) * 300,
      400,
      800 / 3,
    );
  await fs.mkdir(path.join(__dirname, "../.test-build"), { recursive: true });
  await fs.writeFile(
    path.join(__dirname, "../.test-build/community-assets-review.png"),
    sheet.toBuffer("image/png"),
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
