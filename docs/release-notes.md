## Visual Kit 0.7.7

- Consolidate rich-copy actions into Copy with images. Copy for ticket has been removed; reassign any custom shortcut to Copy with images.
- Retain optional image-size normalization under Normalize image sizes on copy. This setting now applies to all rich-copy actions.
- Stop imposing Arial, 14px, line height, and text color on copied HTML so destination editors such as Movidesk can apply their own typography.
- Keep images, explicit image dimensions, semantic formatting, and table layout in rich copies.

Download main.js, manifest.json, and styles.css into your vault's .obsidian/plugins/visual-kit/ directory. Restart Obsidian and enable Visual Kit.

All three assets are built and attested by GitHub Actions. The minimum supported version remains Obsidian Desktop 1.8.0.
