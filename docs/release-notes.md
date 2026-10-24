## Visual Kit 0.7.4

- Synchronize the manifest, package metadata, compatibility map, and installable release assets for version 0.7.4.

- Fix Obsidian source-review errors: use supported styling helpers and native settings headings.
- Add searchable settings on Obsidian 1.13+, with a fallback for older supported versions.
- Use typed Electron imports and decode local image data without fetch or network requests.
- Remove the default global hotkey; assign shortcuts in Settings → Hotkeys.
- Validate saved preferences and use independent, typed undo/redo snapshots.
- Use Fabric's center-based positioning while preserving image and annotation coordinates.
- Add the official Obsidian ESLint checks to release verification.

Download main.js, manifest.json, and styles.css into your vault's .obsidian/plugins/visual-kit/ directory. Restart Obsidian and enable Visual Kit.

All three assets are built and attested by GitHub Actions. The minimum supported version remains Obsidian Desktop 1.8.0.
