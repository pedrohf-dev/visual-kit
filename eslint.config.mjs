import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".test-build/**",
      "main.js",
      "tests/**",
      "scripts/**",
    ],
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: { parserOptions: { projectService: true } },
  },
  {
    files: ["src/html-notes/**/*.ts"],
    // These modules manipulate portable document HTML inside a sandbox, whose
    // standard DOM does not have Obsidian's helpers. Inline document formatting
    // must be serialized, rather than stored in application theme classes.
    rules: {
      "obsidianmd/prefer-create-el": "off",
      "obsidianmd/no-static-styles-assignment": "off",
    },
  },
  {
    files: ["src/html-notes/VisualEditor.ts"],
    // execCommand is deprecated but still implemented by Obsidian's Chromium.
    // Keep it behind one adapter and exercise it in the real browser suite.
    rules: { "@typescript-eslint/no-deprecated": "off" },
  },
]);
