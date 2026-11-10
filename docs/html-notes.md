# HTML notes

Visual Kit 0.8.1 adds local `.html` and `.htm` notes for exchanging formatted responses with ticket systems, email clients and other rich-text editors. Requires Obsidian Desktop 1.8.0 or later. No accounts, cloud editor, API keys or CDN are used.

## Use

1. Click **Add HTML note** beside **New note** in the file explorer, run **Visual Kit: Create HTML note**, or right-click a folder and choose **Create HTML note**. Type a name and press **Enter** (or click **Create**); the name is selected and ready to replace, and `.html` is added automatically. Press **Escape** or **Cancel** to dismiss. The selected folder takes priority over the default note folder. Existing filenames receive a numeric suffix; they are never overwritten. Notes can also be created at the vault root.
2. Paste into **Visual** mode. Use the toolbar or normal formatting shortcuts for bold, italic, underline, strikethrough, headings, paragraphs, fonts, colors, highlights, alignment, lists, links, separators and tables.
3. Changes autosave after 800 ms. **Save** and Ctrl/Cmd+S flush changes. **Source** provides local CodeMirror syntax highlighting, indentation and undo/redo. **Preview** is read-only. Mode switches retain content but start a new visual/source undo history.
4. Select content and use Ctrl/Cmd+C or **Copy as rich HTML**. The selection command asks for a selection if none exists. **Copy whole note** / **Visual Kit: Copy whole HTML note** explicitly exports everything. HTML fragments and plain text are provided; mixed images use embedded data URLs. Image-only copy also provides a native image representation.
5. Paste into the destination and verify the result after it saves/reopens. Destination editors may filter formatting or embedded images. Use the destination's upload control if necessary.

**Open in HTML notes** explicitly opens an existing file even if automatic HTML handling is disabled. Extension conflicts report a notice and keep the existing handler. Change enablement and automatic file handling under **Settings → Visual Kit → HTML notes**, then reload Visual Kit. Explorer visibility with automatic handling disabled depends on Obsidian's file visibility options.

HTML copy preserves note typography by default. Its separate destination compatibility setting opts into the existing font overrides, block flattening and PNG rasterization without changing the saved file or the Markdown clipboard settings.

## Templates and extended formatting

Run **Visual Kit: Save current HTML note as template** to save a reusable copy. Templates live in **HTML Templates** in the vault; edit, rename or delete them using the file explorer, or add your own `.html`/`.htm` files there. There is no template count limit. The creation dialog lists all templates, including subfolders, alongside **Blank note**. New notes are independent copies, and relative image references are adjusted for their destination.

Visual mode supports semantic sections, figures, details/summary, definition lists, highlights, flex and grid layouts, rounded borders, shadows and extended typography. The toolbar adds subscript, superscript, clear formatting and all six heading levels. The active mode is highlighted.

Documents with embedded stylesheets or formatting beyond the visual editor can be edited in **Source** and rendered in **Preview**, which preserves document CSS in an isolated frame. This is broader formatting support, not execution of arbitrary web applications: scripts, interactive forms, external stylesheets and remote resource loading remain disabled. Full-document previews do not provide the visual editor's selection-copy integration.

## Images and tables

Pasted image files, supported base64 data images and public HTTP/HTTPS images reuse attachment folders, naming, byte validation and duplicate preferences. SVG requires explicit PNG export. Saved references are portable relative paths with encoded filenames. Obsidian resource URLs are used only for display.

Opening or previewing does not download remote images. **Import linked images** explicitly downloads them; rich paste also imports them unless disabled. **External images → Block remote downloads** prevents requests, including on rich copy. Private browser images and unsupported/inaccessible images retain their reference and show a placeholder and warning. Paste the actual image file to replace them. With image import disabled, references remain as supplied; clipboard-only files require enabling import and pasting again.

Click an image and choose **Resize image**, **Remove image** or **Annotate image**. Resize changes display dimensions, not stored pixels. Annotation reuses the existing PNG/sidecar editor. A separate HTML adapter asks before replacing the selected reference and refuses stale replacements. Folder moves update image paths in supported notes; Source-only notes warn that paths require manual updates.

Tables preserve sections, column groups, inline cell styles, `rowspan` and `colspan`. Row/column operations work in ordinary tables; restructuring merged cells requires Source mode rather than a guessed grid transformation. Cell color and border changes remain available. There is no visual merge/split tool in this release.

Limits: 25 MB per source image; 32 megapixels per exported image; 32 MB clipboard HTML; 100 images per batch; 32 MB notes for parsing. Compatibility PNG conversion flattens animation. Remote downloads use Obsidian's request API without browser session cookies. Responses are size-checked before import, but that API does not provide a streaming size cutoff.

## Preservation, safety and recovery

Literal source, safe rendered body, editable DOM state and clipboard export are distinct representations. Unedited files are never rewritten. Visual edits replace the body while retaining the original explicit document wrapper, doctype and head. After editing, harmless serialization changes such as attribute quoting and CSS normalization may occur.

Stylesheets, unknown elements/attributes, active embeds, unsafe URLs, SVG and unsupported CSS require Source mode. Original source stays complete; Preview shows a sanitized subset. Visual editing stays locked until unsupported content is resolved. Complete documents without explicit bodies also stay in Source. Unexpected unsupported markup introduced by Chromium is retained in Source rather than replaced with a reduced representation.

Pasting inserts a sanitized copy into the current note without creating a separate HTML file or asking to save the clipboard. Unsupported formatting is removed with a notice; the source clipboard remains available. Text-only HTML pastes do not run attachment import. Async image paste captures the original selection and document revision. If the note changes during image import, content is preserved in a separate `*-paste.html` file instead of overwriting newer edits. Opening an existing file with unsupported content still retains its original source.

DOMPurify sanitizes markup and a separate CSS allowlist removes unsafe properties/values. Rendering uses `sandbox="allow-same-origin"` **without scripts, forms or popups**, plus a restrictive Content Security Policy. Standard DOM handlers are attached by the parent; imported JavaScript is never enabled. Theme CSS stays outside the frame. Inactive owner documents prevent detached image elements from contacting servers during parsing/copy construction. Image display sources are resolved before insertion. Links do not navigate inside the editor or Preview.

Writes serialize through a queue and compare the exact last-read contents inside public `Vault.process`. Conflicts stop autosave and offer **Reload from disk**, **Save edits as copy**, or **Resolve in Source mode**. Reload asks before discarding local edits. Source resolution retains your version for manual comparison; it never silently overwrites the external version. Closing flushes edits or creates a `*-recovered.html` copy if the original cannot be written. If both writes fail, an error is reported and the close handler rejects; resolve the storage failure before relying on closing Obsidian.

HTML notes do not add native backlinks, graph indexing or Markdown plugin integration. Existing Markdown listeners remain scoped to Markdown views.

## Editor decision and round-trip proof

| Candidate                                                                 | Fidelity, maintenance, safety and licensing                                                                                                                                                                                               | Decision                                                             |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [TinyMCE](https://www.tiny.cloud/docs/tinymce/latest/content-filtering/)  | Mature local toolbar/table/image support, configurable schema filtering, larger integration and assets. Self-hosted [licensing](https://www.tiny.cloud/docs/tinymce/latest/license-key/) requires GPL compliance or a commercial license. | Avoid new licensing/asset obligations in this MIT plugin.            |
| [ProseMirror](https://prosemirror.net/docs/guide/) / schema-based editors | MIT, local, strong transactions; DOM imports must conform to a schema, requiring custom preservation for every ticket structure/style.                                                                                                    | Avoid implicit import reduction without a larger preservation layer. |
| [Trix](https://github.com/basecamp/trix)                                  | MIT, locally bundleable, maintained document model; generic table/font/inline-style fidelity would require a preservation layer.                                                                                                          | Does not directly solve arbitrary support-response preservation.     |
| Chromium contenteditable adapter                                          | Already shipped and maintained with Obsidian; no added editor runtime/license. DOM retains supported inline styles, table spans and images. Requires custom controls/history and strict isolation.                                        | Chosen with fail-closed Source fallback.                             |

[`execCommand`](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand) is deprecated but implemented by Chromium and used only behind `VisualEditor.ts` for native formatting/insertion. Plugin-owned undo/redo also covers typing, paste and direct table/image mutations. This is a maintenance tradeoff; future engine replacements must pass the same fixtures. DOMPurify and CodeMirror are locally bundled. Dependency licenses are included in main.js and in the local build package.

`tests/fixtures/support-ticket.html` proves complete-document/head retention, colored/highlighted text, fonts, alignment, nested lists, column groups, merged cells, resized screenshot references and links. An untouched save produces no write. A text edit/save/reopen retains supported formatting and dimensions. `unsupported-ticket.html` proves safe rendering and original-source retention. Real Chromium tests exercise native editing commands, selection-copy wrappers, typing, undo/redo, image resizing/references, Source, autosave, mode switching, whole-note copy, conflict recovery and zero unexpected image requests.

Public APIs were checked against installed `obsidian.d.ts`: `FileView`, `registerView`, `registerExtensions`, leaf `setViewState`, vault read/create/process and modify/delete/rename events. Used feature APIs predate Desktop 1.8.0. Newer development types do not substitute for acceptance testing on that application baseline.

Run `npm test` for simulated vault/clipboard tests. Install Chromium once with `npx playwright install chromium`, then run `npm run test:browser`. With Windows Edge installed, set `VISUAL_KIT_BROWSER_CHANNEL=msedge` instead. The browser suite uses the real editor/view classes with simulated Obsidian/Electron host APIs; it is not a live Obsidian or Movidesk acceptance test.

## Manual acceptance checklist

- [ ] Obsidian Desktop 1.8.0 and current: command/folder creation, explorer visibility, duplicate filenames, explicit open, handler conflict and reload settings.
- [ ] All toolbar operations and Ctrl/Cmd shortcuts; selection retention while using controls; basic table operations and merged-table Source guard.
- [ ] Rich/plain paste; file batches, base64, existing vault and remote images; order, dimensions, configured folders, deduplication, blocked/private image warnings.
- [ ] Resize and annotate; unchanged original pixels, saved PNG/sidecar, replacement choice and stale-note guard.
- [ ] Save/reopen, all mode switches, rename/move/delete, external edits, write failure and close recovery. Verify neither external data nor local edits are silently lost.
- [ ] Unsafe HTML, unsupported structures and stylesheets: source retained; scripts, navigation, theme escape and unexpected image requests prevented.
- [ ] Selection/whole-note copy into at least two external editors; verify image dimensions and content after destination save/reopen. Recheck Markdown copy/paste, annotation and normalization.
- [ ] **Movidesk:** copy a formatted response with paragraphs, colors/highlights, nested lists, table, links and resized screenshots; paste into an HTML note; visually edit; save/close/reopen; rich-copy into a draft response; save/reopen and compare. Test compatibility both off and on. Use Movidesk upload if it rejects embedded images.

Authenticated Movidesk acceptance remains manual. Destination filtering and image retention are outside Visual Kit's control; pixel-perfect compatibility is not claimed.
