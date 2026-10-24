import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
await mkdir(".test-build", { recursive: true });
await build({
  entryPoints: [
    "tests/core.test.ts",
    "tests/workflow.test.ts",
    "tests/render.test.ts",
  ],
  outdir: ".test-build",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  format: "cjs",
  alias: {
    obsidian: resolve("tests/obsidian-mock.ts"),
    electron: resolve("tests/electron-mock.ts"),
  },
  external: ["jsdom"],
  plugins: [
    {
      name: "fabric-node",
      setup(builder) {
        builder.onResolve({ filter: /^fabric$/ }, () => ({
          path: "fabric/node",
          external: true,
        }));
      },
    },
  ],
});
const result = spawnSync(
  process.execPath,
  [
    "--test",
    ".test-build/core.test.cjs",
    ".test-build/workflow.test.cjs",
    ".test-build/render.test.cjs",
  ],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
