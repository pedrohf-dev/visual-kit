<div align="center">

# Visual Kit

### Screenshots, annotations, and documentation. Inside Obsidian.

Turn screenshots into clear, organized evidence — from capture to ticket.

**Desktop · Local processing · Obsidian 1.8+ · v0.7.0**

[Installation](#installation) · [Quick start](#quick-start) · [Features](#features) · [Development](#development)

</div>

---

**Visual Kit** brings your image workflow into Obsidian. Paste multiple screenshots, reuse duplicates, highlight what matters, standardize image sizes, and copy your documentation with images into a rich-text editor.

Built for QA, support, bug reports, and anyone who explains things with screenshots.

```text
Capture → Paste → Deduplicate → Annotate → Normalize → Document → Copy
```

## Features

| Feature                         | What you can do                                                                            |
| :------------------------------ | :----------------------------------------------------------------------------------------- |
| **Batch paste**                 | Insert multiple images in clipboard order, with configurable file names and folders.       |
| **Content-based deduplication** | Reuse byte-identical images using SHA-256. Choose Reuse, Ask, or Always save.              |
| **Built-in image editor**       | Add arrows, rectangles, ellipses, multiline text, freehand drawings, and numbered markers. |
| **Evidence tools**              | Highlight regions, cover sensitive details with opaque rectangles, and crop images.        |
| **Editable annotations**        | Move, resize, change properties, and undo/redo. Save editable data alongside the PNG.      |
| **Consistent image sizes**      | Normalize a note or selection to 400, 600, 800 px, or a custom width.                      |
| **Rich copy**                   | Copy formatted text and embedded local images, with dimensions, as HTML and plain text.    |
| **Save & Copy**                 | Save an annotated image and copy it in one action.                                         |

## Installation

### From the packaged build

1. Extract **`visual-kit-0.7.0.zip`** from the prepared project's `dist` folder.
2. Copy the **`visual-kit`** folder into your vault's plugin directory:

   ```text
   Your Vault/
   └── .obsidian/
       └── plugins/
           └── visual-kit/
               ├── main.js
               ├── manifest.json
               └── styles.css
   ```

3. Restart Obsidian.
4. Open **Settings → Community plugins** and enable **Visual Kit**. If Restricted mode is enabled, allow community plugins first.

The files must sit directly inside `visual-kit`, without a second nested `visual-kit` folder.

> This version requires manual installation. Visual Kit is not yet listed in the community plugin directory. Generated files in `dist` are not tracked in Git; when cloning the repository, build from source below.

### From source

```sh
npm ci
npm run build
```

Copy the generated **`dist/visual-kit`** folder into your vault's `.obsidian/plugins/` directory. Dependencies are bundled; do not copy `node_modules` into Obsidian.

### Upgrading from the previous name

The plugin ID changed from `qa-rich-copy` to `visual-kit`. Disable the old plugin before enabling Visual Kit to avoid duplicate paste/copy handlers. To keep your preferences, copy `data.json` from the old plugin folder into the new one while Obsidian is closed.

Annotation files retain the **`.qrc.json`** extension for compatibility with existing evidence.

## Quick start

1. **Paste your images.** Open a note and press `Ctrl+V`. Existing byte-identical images are reused by default.
2. **Set a consistent width.** In the command palette, run **Visual Kit: Normalize image sizes** and choose a width such as `600 px`.
3. **Annotate a screenshot.** Right-click the image and choose **Annotate**, or place the cursor inside its embed and run **Annotate image**.
4. **Explain the issue.** Add an arrow, a rectangle, and a text annotation. Choose **Save as new** to preserve the original.
5. **Update the note.** Replace the embed, keep the original, or insert the annotated image below it.
6. **Copy your documentation.** Select the content and run **Copy for Ticket**. Without a selection, the command uses the entire note.
7. **Paste into your destination.** Check the images and formatting in your ticket editor.

> Image support depends on the destination editor. End-to-end compatibility with Movidesk, Outlook, and other applications still requires manual validation. Visual Kit does not upload images to those services.

## Commands

All commands appear in the command palette with the **Visual Kit** prefix.

| Command                                | Action                                                                             |
| :------------------------------------- | :--------------------------------------------------------------------------------- |
| `Copy with Images`                     | Copy the selection or note with formatted text and embedded local images.          |
| `Copy for Ticket`                      | Copy rich content, optionally normalizing image sizes only in the exported HTML.   |
| `Annotate image`                       | Open the image referenced by the embed under the cursor.                           |
| `Normalize image sizes`                | Choose a width, preset, and scope.                                                 |
| `Normalize images using default width` | Apply the default width to the selection, or to the note when nothing is selected. |
| `Rebuild image duplicate index`        | Rebuild the local image hash index.                                                |

### Copy modes

| Mode                     | Behavior in the editor                                |
| :----------------------- | :---------------------------------------------------- |
| **Smart Copy** — default | Intercept copying when the selection contains images. |
| **Dedicated**            | Use rich copy only through the plugin's commands.     |
| **Always Rich Copy**     | Intercept copying for any text selection.             |

### Image editor shortcuts

| Shortcut                   | Tool or action                           |
| :------------------------- | :--------------------------------------- |
| `V` / `A` / `R` / `E`      | Select / arrow / rectangle / ellipse     |
| `T` / `D` / `N` / `H`      | Text / freehand / number / highlight     |
| `Delete` or `Backspace`    | Delete selected objects                  |
| `Ctrl+Z`                   | Undo                                     |
| `Ctrl+Shift+Z` or `Ctrl+Y` | Redo                                     |
| `Ctrl+S`                   | Save using the configured save mode      |
| `Ctrl+Shift+C`             | Copy the rendered image with annotations |
| `Ctrl` + mouse wheel       | Zoom                                     |
| `Space` + drag             | Pan                                      |

On macOS, use `Cmd` instead of `Ctrl`. Quick normalization uses `Ctrl+Alt+I` (`Cmd+Option+I` on macOS). Global shortcuts can be changed under **Settings → Hotkeys**.

## Useful settings

| Setting                           | Default                   |
| :-------------------------------- | :------------------------ |
| Normalized width                  | `600 px`                  |
| Apply default width when pasting  | Off                       |
| Blank line between images         | On                        |
| Image folder                      | `attachments`             |
| File name template                | `{note}-{date}-{counter}` |
| Duplicate action                  | Reuse existing            |
| Preserve explicit height          | Off                       |
| Normalize on Copy for Ticket      | Off                       |
| Preserve editable annotation data | On                        |
| Save mode                         | New image                 |

Image folders accept values such as `attachments`, `attachments/{note}`, `images`, `same-folder`, or another path relative to the vault.

Normalization changes only the visual size in Markdown, leaving the image file untouched. For example, at `600 px`:

```md
![[login.png|600]]

![[error.png|600]]

![Dashboard|600](dashboard.png)
```

PDF, audio, video, Canvas, and note embeds are not resized. Code examples are preserved. A single undo action reverses the normalization.

## Saving and privacy

Processing happens locally, without servers, upload APIs, or remote image editing services.

- **Save as new:** create an annotated PNG without overwriting the original.
- **Save copy:** choose a custom file name.
- **Replace original:** overwrite a PNG after confirmation.
- **Flatten image:** turn the current annotations into pixels; save afterward to write the result.
- **Editable data:** the `image.qrc.json` file stores the source image and annotation objects for later editing.

> **When sharing redacted evidence, send only the exported PNG.** The original image and `.qrc.json` file may contain the information you covered visually.

Remote images are not downloaded during export. Editing a GIF frame requires confirmation, and GIF files are never overwritten with PNG data. Duplicate detection never deletes existing images automatically.

## Current limitations

- **Desktop only.** Windows is the priority platform; macOS and Linux still need real-world validation. Mobile is not included.
- **Clipboard input varies.** Some applications expose only one image even when multiple items are selected. In those cases, copy the image files instead.
- **Exact hashes.** The same image with different compression or a different format is treated as a different file.
- **Partial failures preserve successful items.** Failed items are reported. If a note changes during paste, embeds are appended to the original note.
- **Manual integration testing remains.** Automated tests do not establish end-to-end behavior inside Obsidian or clipboard compatibility with Movidesk.

## Development

Use a Node.js version supported by the project dependencies. This implementation was validated with Node.js 24.

```sh
npm ci
npm run check
npm test
npm run build
```

| Command          | Purpose                                                         |
| :--------------- | :-------------------------------------------------------------- |
| `npm run check`  | Check TypeScript types                                          |
| `npm test`       | Run logic, workflow, HTML export, and rasterization tests       |
| `npm run build`  | Generate `main.js` and the installable `dist/visual-kit` folder |
| `npm run format` | Format source code and documentation                            |

```text
src/
├── clipboard/    # HTML, images, and clipboard output
├── duplicates/   # SHA-256 and the local index
├── editor/       # Fabric.js, tools, history, and persistence
├── paste/        # Clipboard input, file naming, and batch paste
├── sizing/       # Embed parsing and size normalization
├── main.ts       # Commands, events, menus, and settings UI
└── settings.ts   # Preferences and defaults
tests/           # Automated tests and test adapters
docs/            # Product and technical specification
```

Fabric.js is bundled. Obsidian and Electron are provided by the host application. The Fabric license is included in the package as `FABRIC-LICENSE.txt`.

See [VALIDATION.md](VALIDATION.md) for results and coverage limitations, and the [v2.2 specification](docs/spec-v2.2.md) for product requirements and planned features.

## First-run checklist

- [ ] Paste four images and check their order, file names, and optional default width.
- [ ] Paste them again and confirm reuse without additional image files.
- [ ] Add an arrow, rectangle, and text; save and reopen the PNG.
- [ ] Try undo/redo, cropping, and copying the annotated image.
- [ ] Normalize a note or selection and undo it in one action.
- [ ] Copy content with a list, table, code, checkbox, and screenshots.
- [ ] Paste into your ticket editor and check images, dimensions, and formatting.

## Roadmap

Future features specified for later releases: batch Paste & Annotate, Save & Next, a dedicated screenshot shortcut, perceptual duplicate detection, guided duplicate cleanup, blur/pixelation, section-level normalization, and JPEG/WebP export.

## Support

If Visual Kit helps you document your work, consider supporting its development. Thank you for your support!

[Buy me a coffee on Ko-fi](https://ko-fi.com/pedrohlf)
