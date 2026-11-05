# Implementation validation

Version 0.8.4 validation performed on November 5, 2026. This patch uses Obsidian DOM helpers for isolated document creation and serialized note formatting, and removes broad HTML-note lint exclusions. Browser integration checks cover script/network isolation. External review results require a new review run.

| Check                                                                   | Result                                                                                                                      |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Official Obsidian ESLint rules (`npm run lint`)                         | Passed with zero errors and warnings                                                                                        |
| TypeScript (`npm run check`)                                            | Passed                                                                                                                      |
| Automated tests (`npm test`)                                            | 58 passed                                                                                                                   |
| Chromium editor/view integration (`npm run test:browser`, Windows Edge) | Passed; real editing engine with simulated host APIs                                                                        |
| Production build (`npm run build`)                                      | Passed                                                                                                                      |
| Dependency audit                                                        | 14 moderate advisories in the existing lint tooling dependency tree (minimatch); no production dependency advisory reported |

Automated coverage includes wiki and Markdown image syntax and dimensions; preservation of code and non-image embeds; file names and folders; SHA-256; history; sidecar validation; four-image paste order; deduplication across pastes and within a batch; collision-free names in Always save mode; partial failures; index revalidation; protection against overwriting edits made during paste; PNG export with cropping and zoom; opaque redaction pixels; reopening annotation objects and undo/redo; HTML export with embedded images; and output-only normalization that leaves the source Markdown unchanged.

Tests use simulated adapters for the Vault, Editor, MarkdownRenderer, and Electron clipboard APIs. Rasterization tests use Fabric.js with a real canvas implementation in Node. They do not replace interface or clipboard testing inside Obsidian Desktop.

HTML-specific tests additionally cover byte-identical unedited saves; edited document round trips with styles, lists, table spans and image dimensions; original unsupported-source retention; malicious markup/URL/CSS rejection; inactive-document parsing; source size limits; safe body boundaries; portable image paths; atomic conflicts, concurrent writes and write failures; HTML creation collisions; image validation/deduplication; inaccessible and blocked remote images; rich clipboard flavors, image embedding and unchanged clipboard on failure; extension conflicts; and saved setting validation.

The Chromium suite exercises actual contenteditable commands, formatting and inherited selection wrappers, native typing, undo/redo, image display resize/canonical references, CodeMirror source editing, script/network isolation, and the complete HTML view's autosave, mode switches, Preview, whole-note clipboard export, conflict copy and unsafe-source fallback. Screenshots are generated in `.test-build`. GitHub release CI uses its preinstalled Chrome and runs this suite before building and attesting assets.

## Implementation map

| Files                                                              | Responsibility                                                                                                 |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `src/html-notes/HtmlDocument.ts`                                   | Literal source, safe rendering, CSS/URL policy, body-only serialization, plain-text export                     |
| `src/html-notes/VisualEditor.ts`, `SourceEditor.ts`                | Isolated visual editor/selection/history adapter and locally bundled syntax-highlighted source                 |
| `src/html-notes/HtmlNoteView.ts`, `Persistence.ts`                 | Public FileView, modes, toolbar, debounced atomic writes, external changes, move/delete and recovery           |
| `src/html-notes/Assets.ts`, `Clipboard.ts`                         | Reused image infrastructure, relative references, explicit remote import, portable selection/whole-note export |
| `src/html-notes/register.ts`, `src/main.ts`                        | Creation, explicit opening, palette commands, folder menus and non-destructive extension registration          |
| Settings/storage/descriptions, styles                              | Feature configuration, validation and Obsidian controls                                                        |
| Existing annotation editor and clipboard writer                    | HTML-specific annotation callback; optional native image flavor without changing Markdown copy                 |
| Tests, build, release workflow, version metadata and documentation | Regression/Chromium validation, bundled licenses and installable 0.8.1 release                                 |

Live Obsidian Desktop validation (including minimum version and native OS clipboard behavior) and authenticated Movidesk acceptance remain manual. See the [HTML notes guide and checklist](docs/html-notes.md). Merged-table restructuring and unsupported stylesheets/active content require Source mode; visual/source switches reset editor undo history. Destination filtering and embedded-image retention are outside Visual Kit's control. Pixel-perfect compatibility is not claimed.
