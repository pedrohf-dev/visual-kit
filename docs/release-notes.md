## Visual Kit 0.8.5 — Quick HTML note creation

- Add **Add HTML note** beside the file explorer's **New note** action.
- Focus and select the note name immediately; press **Enter** to create from the explorer, command palette or folder menu. The `.html` extension is added automatically.
- Accept Obsidian's vault-root folder when creating HTML notes, fixing the misleading **Image folder must be relative to the vault** error.

## Visual Kit 0.8.4 — Obsidian review fixes

- Use Obsidian DOM helpers to create empty elements, adopting them into the target inactive or sandbox document before adding content.
- Apply serialized table borders and proportional image sizing through the host setCssStyles helper, including elements from isolated documents.
- Remove broad HTML-note lint exclusions so the standard DOM-helper and static-style rules run locally and in release CI.
- Wait for the Preview iframe body before asserting its text in browser tests. Version 0.8.3 was not published because this test raced frame initialization in CI.
- Retain creator credit and README artwork.

Vault enumeration supports attachment deduplication; clipboard access supports paste and rich copy. These are expected capabilities. The existing execCommand adapter remains deprecated and covered by browser integration tests. External review results require a new review run.

## Visual Kit 0.8.2 — Creator credit and refreshed overview

- Correct the plugin creator to **pedrof**, with a link to the creator's GitHub profile. The plugin remains **Visual Kit** with the same plugin ID and settings.
- Replace the README overview with a sharper seven-feature illustration covering screenshot tools and HTML notes. Include editable SVG artwork and a reproducible PNG generator.
- Update the README introduction, author credit and quick starts for Markdown and HTML notes. Clarify selection copy versus explicit whole-note copy.

Update Visual Kit and reload Obsidian to refresh the installed author metadata.

### HTML notes, introduced in 0.8.1

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

Movidesk and other destination editors control paste filtering and image retention. Authenticated Movidesk acceptance remains a documented manual step; pixel-perfect compatibility is not claimed. See the [HTML notes guide](https://github.com/pedrohf-dev/visual-kit/blob/0.8.1/docs/html-notes.md) for behavior, limits, architecture and the acceptance checklist.

### Install

Download **main.js**, **manifest.json** and **styles.css** into `<your-vault>/.obsidian/plugins/visual-kit/`, then restart Obsidian. All three assets are built and attested by GitHub Actions. Bundled dependency licenses are included in main.js.
