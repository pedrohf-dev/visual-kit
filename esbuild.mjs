import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron"],
  platform: "browser",
  format: "cjs",
  target: "es2022",
  outfile: "main.js",
  logLevel: "info",
});
await mkdir("dist/visual-kit", { recursive: true });
for (const file of ["main.js", "manifest.json", "styles.css"])
  await copyFile(file, `dist/visual-kit/${file}`);
for (const file of ["README.md", "VALIDATION.md"])
  await copyFile(file, `dist/visual-kit/${file}`);
await copyFile(
  "node_modules/fabric/LICENSE",
  "dist/visual-kit/FABRIC-LICENSE.txt",
);
await mkdir("dist/visual-kit/docs", { recursive: true });
await copyFile("docs/spec-v2.2.md", "dist/visual-kit/docs/spec-v2.2.md");
