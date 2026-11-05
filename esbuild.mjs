import { build } from "esbuild";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
const license = await readFile("LICENSE", "utf8");
const fabricLicense = await readFile("node_modules/fabric/LICENSE", "utf8");
const result = await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron"],
  platform: "browser",
  format: "cjs",
  target: "es2022",
  outfile: "main.js",
  write: false,
  metafile: true,
  logLevel: "info",
  banner: {
    js: `/*! Visual Kit\n${license}\nBundled Fabric.js license:\n${fabricLicense}\n*/`,
  },
});
// Release users download main.js alone: carry the complete bundled dependency
// licenses inside that asset, as well as a readable copy in the local package.
const packages = new Set();
for (const input of Object.keys(result.metafile.inputs)) {
  if (!input.includes("node_modules/")) continue;
  let folder = dirname(input);
  while (folder.includes("node_modules")) {
    try {
      await readFile(join(folder, "package.json"));
      packages.add(folder);
      break;
    } catch {
      folder = dirname(folder);
    }
  }
}
let notices = "";
for (const folder of [...packages].sort()) {
  const pkg = JSON.parse(await readFile(join(folder, "package.json"), "utf8"));
  for (const name of [
    "LICENSE",
    "LICENSE.txt",
    "LICENSE.md",
    "license",
    "license.md",
  ]) {
    try {
      notices += `\n${pkg.name} ${pkg.version}\n${await readFile(join(folder, name), "utf8")}\n`;
      break;
    } catch {
      /* Try the next common license filename. */
    }
  }
}
await writeFile(
  "main.js",
  `/*! Bundled dependency licenses\n${notices.replaceAll("*/", "* /")}\n*/\n${result.outputFiles[0].text}`,
);
await mkdir("dist/visual-kit", { recursive: true });
await writeFile("dist/visual-kit/THIRD-PARTY-LICENSES.txt", notices);
for (const file of ["main.js", "manifest.json", "styles.css"])
  await copyFile(file, `dist/visual-kit/${file}`);
for (const file of ["README.md", "VALIDATION.md", "LICENSE"])
  await copyFile(file, `dist/visual-kit/${file}`);
await copyFile(
  "node_modules/fabric/LICENSE",
  "dist/visual-kit/FABRIC-LICENSE.txt",
);
await mkdir("dist/visual-kit/docs", { recursive: true });
await copyFile("docs/spec-v2.2.md", "dist/visual-kit/docs/spec-v2.2.md");
await copyFile("docs/html-notes.md", "dist/visual-kit/docs/html-notes.md");
