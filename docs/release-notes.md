## Visual Kit 0.8.0 — HTML notes

Create real `.html` notes in your vault and exchange formatted responses with ticket systems, email clients and other rich-text editors.

- Create notes from the command palette or a folder menu, with safe filename collision handling.
- Edit visually with font/color/highlight controls, alignment, lists, links, separators, tables and images. Switch to syntax-highlighted Source or read-only Preview without losing content.
- Autosave locally, or use Save / Ctrl+S / Cmd+S. Unedited files remain byte-identical. External changes stop conflicting writes and offer reload, source resolution or a recovery copy.
- Paste rich HTML and images in order using existing attachment folders, naming, validation and deduplication. Resize display dimensions and reuse the annotation editor through an HTML adapter.
- Copy selected content as rich HTML and plain text, or explicitly copy the whole note. Vault images become embedded clipboard images. Resource URLs are never saved or exported. HTML destination compatibility is a separate opt-in.
- Preserve unsupported source in Source mode. Unsupported pasted markup requires an explicit choice to preserve its original in a separate file before safe insertion.
- Sanitize with DOMPurify, allowlist inline CSS and render inside a script-disabled frame. Inactive-document parsing prevents detached image requests. Opening notes does not contact image servers.
- Add preservation, security, clipboard and persistence tests plus real Chromium editor/view integration tests. Existing Markdown workflows remain unchanged.

### Compatibility and limits

Requires Obsidian Desktop 1.8.0 or later. HTML handler conflicts keep the other plugin's handler; **Open in HTML notes** remains available. Reload after changing enablement or automatic handling.

Table spans are retained; visual row/column restructuring of merged tables requires Source. Stylesheets, unsupported structures/CSS and active embeds stay in Source. SVG needs raster export. Mode switches reset that mode's undo history. Native HTML backlinks and graph indexing are not added.

Movidesk and other destination editors control paste filtering and image retention. Authenticated Movidesk acceptance remains a documented manual step; pixel-perfect compatibility is not claimed. See the [HTML notes guide](https://github.com/pedrohf-dev/visual-kit/blob/0.8.0/docs/html-notes.md) for behavior, limits, architecture and the acceptance checklist.

### Install

Download **main.js**, **manifest.json** and **styles.css** into `<your-vault>/.obsidian/plugins/visual-kit/`, then restart Obsidian. All three assets are built and attested by GitHub Actions. Bundled dependency licenses are included in main.js.
