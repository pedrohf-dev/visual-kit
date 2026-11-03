## Visual Kit 0.7.8

- Destination compatibility mode now copies inline content without outer paragraph, heading, or code-font wrappers. Optional font, size, and color overrides let you match a macro when the destination does not inherit caret formatting.
- Decode images before copying. Compatibility mode exports PNG pixels at the requested dimensions, keeping their size even when the destination strips width attributes. Animation is flattened; SVG must be exported to PNG first.
- Reject empty, corrupt, oversized, or unsupported images before changing the clipboard. Limits: 25 MB per source image, 32 megapixels per exported image, and 32 MB of clipboard HTML.
- Add descriptions to every setting and validate saved numeric preferences.
- Remove the duplicate Copy image with annotations menu item. Copy image includes saved annotations; the annotation editor's Copy action includes unsaved edits.
- Fix normalization presets: the width field now matches the selected preset and Custom restores the entered width. Invalid widths keep the dialog open.

Destination editors still control paste styling and image retention after saving. Visual Kit embeds images locally; it does not upload them to Movidesk. If the destination removes embedded images, use its image upload action.

Download main.js, manifest.json, and styles.css into your vault's .obsidian/plugins/visual-kit/ directory. Restart Obsidian and enable Visual Kit.

All three assets are built and attested by GitHub Actions. The minimum supported version remains Obsidian Desktop 1.8.0.
