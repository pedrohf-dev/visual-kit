## Visual Kit 0.7.6

- Import images from pasted HTML while preserving surrounding text and image order, including content copied from email drafts.
- Support attached image files, embedded base64 images, and downloadable HTTP/HTTPS images. Downloads happen only when pasting image-containing HTML with multi-image paste enabled.
- Preserve text and show a placeholder when an image cannot be imported. Private Gmail images may require the browser's authenticated session: copy the image itself or save it and paste the file in that case.
- Reuse duplicate detection, image naming, and protection against overwriting edits made during paste.

Download main.js, manifest.json, and styles.css into your vault's .obsidian/plugins/visual-kit/ directory. Restart Obsidian and enable Visual Kit.

All three assets are built and attested by GitHub Actions. The minimum supported version remains Obsidian Desktop 1.8.0.
