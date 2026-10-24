# Implementation validation

Baseline validation performed on October 24, 2026. Version 0.7.2 adds local image decoding, saved-data validation, independent history snapshots, and center-origin annotation positioning checks.

| Check                                        | Result                                              |
| -------------------------------------------- | --------------------------------------------------- |
| Official Obsidian ESLint rules (`npm run lint`) | Passed with zero errors and warnings |
| TypeScript (`npm run check`)                 | Passed                                              |
| Automated tests (`npm test`)                 | 30 passed                                           |
| Production build (`npm run build`)           | Passed                                              |
| Dependency audit after the dependency update | 0 reported vulnerabilities at the time of the audit |

Automated coverage includes wiki and Markdown image syntax and dimensions; preservation of code and non-image embeds; file names and folders; SHA-256; history; sidecar validation; four-image paste order; deduplication across pastes and within a batch; collision-free names in Always save mode; partial failures; index revalidation; protection against overwriting edits made during paste; PNG export with cropping and zoom; opaque redaction pixels; reopening annotation objects and undo/redo; HTML export with embedded images; and output-only normalization that leaves the source Markdown unchanged.

Tests use simulated adapters for the Vault, Editor, MarkdownRenderer, and Electron clipboard APIs. Rasterization tests use Fabric.js with a real canvas implementation in Node. They do not replace interface or clipboard testing inside Obsidian Desktop.

Manual testing is still needed for paste/copy events and menus inside Obsidian, supported operating systems, and acceptance of HTML with embedded images in Movidesk, Outlook, and other destinations. See the first-run checklist in the README.
