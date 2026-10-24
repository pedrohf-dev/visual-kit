import { build } from "esbuild";
import { mkdir, copyFile, readFile } from "node:fs/promises";
const license = await readFile("LICENSE", "utf8");
const fabricLicense = await readFile("node_modules/fabric/LICENSE", "utf8");
await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron"],
  platform: "browser",
  format: "cjs",
  target: "es2022",
  outfile: "main.js",
  logLevel: "info",
  banner: {
    js: `/*! Visual Kit\n${license}\nBundled Fabric.js license:\n${fabricLicense}\n*/`,
  },
});
await mkdir("dist/visual-kit", { recursive: true });
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
