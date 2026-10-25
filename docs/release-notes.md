## Visual Kit 0.7.5

- Fix overlapping context menus when right-clicking an embedded image.
- Add icons to every Visual Kit image-menu action and remove duplicate editor-menu actions.
- Resolve image actions from the clicked pane, including inactive panes.
- Prevent changes to the wrong embed when an image appears multiple times in a note. Use the command on the source embed to annotate a specific occurrence.
- Keep the red color used by Mark error from changing the default annotation color.

Download main.js, manifest.json, and styles.css into your vault's .obsidian/plugins/visual-kit/ directory. Restart Obsidian and enable Visual Kit.

All three assets are built and attested by GitHub Actions. The minimum supported version remains Obsidian Desktop 1.8.0.
