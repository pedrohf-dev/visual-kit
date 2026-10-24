## Visual Kit 0.7.1

- Add an MIT license for Visual Kit and embed the bundled Fabric.js license in `main.js`.
- Build, test, and publish release assets through GitHub Actions with verified artifact attestations.
- Publish only the three files installed by Obsidian: `main.js`, `manifest.json`, and `styles.css`.
- Stop automatic hash indexing when duplicate detection is disabled.
- Document clipboard access and vault enumeration in the README.

### Installation

Download the three assets into `<vault>/.obsidian/plugins/visual-kit/`, restart Obsidian, and enable Visual Kit in Settings → Community plugins. Requires Obsidian Desktop 1.8.0 or later.

Vault enumeration is used for local image discovery and duplicate detection. Clipboard access is used for user-initiated paste and rich-copy actions. These capability notices are expected; no background clipboard polling or external image uploads are performed.

End-to-end behavior in Obsidian and compatibility with destination editors still require manual testing.
