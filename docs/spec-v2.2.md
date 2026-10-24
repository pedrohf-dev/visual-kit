# Visual Kit — Product & Technical Specification v2.2

This English edition consolidates the requirements of the original v2.2 specification under the Visual Kit name (previously Obsidian QA Rich Copy). It describes product requirements, including future work; it is not a claim that every planned feature is implemented. See the README and VALIDATION.md for current behavior and validation status.

## 1. Product vision

Visual Kit is an Obsidian Desktop plugin for QA analysts, software testers, support specialists, developers, and anyone preparing documentation, bug reports, tickets, or visual evidence. The product should not be limited to QA-specific use cases.

The goal is to keep the evidence workflow inside Obsidian:

```text
Capture → Paste → Deduplicate → Annotate → Normalize → Explain → Copy → Ticket
```

Users should not need to save each screenshot manually, paste images one by one, create redundant files, open an external image editor, resize every image separately, repair embeds, or copy each image individually into a ticket.

## 2. Platform and privacy

- Target Obsidian Desktop, with Windows as the priority platform, followed by macOS and Linux.
- Mobile is outside the initial scope.
- Process images locally. Do not use external servers, upload APIs, remote editors, or cloud processing.
- Never automatically delete existing images because they share a hash.
- Exact deduplication may reuse existing files; cleanup of existing files requires explicit user action.

## 3. Problems addressed

| Problem                                                | Required outcome                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| Image embeds copied as Markdown                        | Copy formatted text and actual embedded image data.                     |
| External annotation tools interrupt work               | Annotate screenshots without leaving Obsidian.                          |
| Inconsistent screenshot sizes                          | Normalize the visual width of images in a note or selection.            |
| Multiple screenshots require separate paste operations | Process all compatible clipboard image items as one batch.              |
| Repeated pastes create redundant files                 | Detect identical binary content and reuse an existing image by default. |

## 4. Primary workflow

1. Copy one or more screenshots or image files.
2. Paste into an Obsidian note.
3. Save files automatically, checking for duplicates first.
4. Insert the image embeds in clipboard order.
5. Open an image in Annotate.
6. Add a rectangle, arrow, and text annotation.
7. Save the annotated image and update its embed.
8. Normalize image widths.
9. Write the explanation around the evidence.
10. Select the content and run Copy with Images or Copy for Ticket.
11. Paste the result into Movidesk or another rich-text editor.

## 5. Integrated image editor

Expose **Annotate image** through the command palette, image context menu, file explorer context menu, and a user-configurable hotkey.

### Required tools

| Tool          | Requirements                                                                            | Shortcut |
| ------------- | --------------------------------------------------------------------------------------- | -------- |
| Select        | Select, move, resize, change properties, and delete objects                             | V        |
| Arrow         | Color, stroke width, arrowhead size, opacity                                            | A        |
| Rectangle     | Outline, fill, transparent fill, stroke width, color, opacity; optional rounded corners | R        |
| Ellipse       | Elliptical annotation                                                                   | E        |
| Text          | Multiline text, font size, color, background, bold, alignment                           | T        |
| Freehand      | Stroke width, color, opacity                                                            | D        |
| Number marker | Automatically numbered markers                                                          | N        |
| Highlight     | Semitransparent region                                                                  | H        |
| Redaction     | Solid rectangle covering sensitive information                                          | —        |
| Crop          | Crop before or after adding annotations                                                 | —        |

Blur and pixelation are future redaction modes. Initial redaction uses a fully opaque rectangle.

### History and navigation

- Undo: Ctrl+Z.
- Redo: Ctrl+Shift+Z or Ctrl+Y.
- Ctrl+wheel: zoom.
- Wheel: scroll.
- Space+drag: pan.
- Provide Fit image, 100%, Zoom in, and Zoom out controls.
- Use the platform modifier equivalent on macOS.

### Colors and presets

Provide red, yellow, green, blue, white, and black. Remember the last color used.

| Preset    | Color  |
| --------- | ------ |
| Error     | Red    |
| Attention | Yellow |
| Success   | Green  |
| Info      | Blue   |

## 6. Saving and editable annotations

- **Save as new image:** recommended default, for example `login.png` → `login-annotated.png`.
- **Replace original:** require confirmation before overwriting.
- **Save copy:** allow a custom file name.
- **Non-destructive editing:** preferably store editable data separately, for example `login-annotated.png` and `login-annotated.qrc.json`.
- **Flatten image:** convert annotation objects into permanent pixels.
- After saving a new image, offer Replace, Keep original, and Insert annotated below for the note embed.
- **Copy** in the editor renders the image and annotations to the clipboard.
- **Save & Copy** follows render → save → clipboard.
- Default export format: PNG. JPEG and WebP export are future work.
- Never silently replace an animated GIF with a static image.

Editable sidecars may retain the original image, including information hidden by redaction. Share the flattened PNG rather than the original or sidecar when distributing redacted evidence.

## 7. Quick actions

The image context menu should expose:

```text
Annotate
Copy image
Copy image with annotations
Open image
Resize
Normalize note images
```

QA workflow quick actions should include Annotate, Mark error, Add arrow, Add rectangle, Add number, Resize, Normalize note images, and Copy for ticket.

## 8. Rich copy and ticket export

Copy both `text/plain` and `text/html`, with real embedded image data instead of visible Markdown image references.

Example input:

```md
Description

![[evidence.png|500]]

Additional context
```

Respect both width-only and explicit width/height embeds:

```md
![[image.png|500]]
![[image.png|500x300]]
```

Preserve bold, italic, headings, links, ordered and unordered lists, tables, code, blockquotes, and checkboxes.

### Copy modes

- Dedicated.
- Smart Copy — default.
- Always Rich Copy.

### Copy for Ticket pipeline

```text
Selection → Render Markdown → Resolve images → Apply dimensions
          → Optional normalization → Embed images → Clean HTML → Clipboard
```

Compatibility priorities from the original specification:

1. Movidesk.
2. Outlook.
3. Gmail, Google Docs, Word, Slack, and other rich-text editors.

These are compatibility targets, not verified compatibility claims. Destination editors may reject or transform embedded image data.

## 9. Image size normalization

Provide **Normalize image sizes** with a width input, Current note / Current selection scope, Cancel, and Apply.

Provide **Normalize images using default width**, with a suggested Ctrl+Alt+I shortcut and an optional ribbon button.

Supported syntax:

```md
![[image.png]]
![[image.png|400]]
![[image.png|400x300]]
![](image.png)
```

Requirements:

- Change only visual dimensions in Markdown, never image pixels.
- Apply width and preserve aspect ratio by default.
- Remove explicit height unless Preserve explicit height is enabled.
- Undo the entire normalization in one editor operation.
- Do not change PDF, audio, video, Canvas, or embedded notes.
- Current section scope is future work.

| Setting or preset            | Default / value              |
| ---------------------------- | ---------------------------- |
| Default normalized width     | 600 px                       |
| Preserve explicit height     | Off                          |
| Normalize on Copy for Ticket | Off                          |
| Small                        | 400 px                       |
| Medium                       | 600 px                       |
| Large                        | 800 px                       |
| Original                     | Remove visual size overrides |

Normalize on Copy for Ticket must affect only the exported HTML, leaving the source Markdown unchanged.

## 10. Multi-image paste

Recognize multiple image items, multiple image files, or a compatible combination exposed by the clipboard. Preserve their original order.

```text
Clipboard → Enumerate items → Validate formats → Check duplicates
          → Generate names → Save files → Insert embeds
```

Settings:

- Paste multiple images.
- Apply default width to pasted images — off by default.
- Insert a blank line between pasted images — on by default.
- File name template, default `{note}-{date}-{counter}`.
- Default image folder.

Supported folder choices include `attachments/`, `attachments/{note}/`, `images/`, `same-folder`, and a custom vault-relative folder.

File names must be unique, even when the configured template produces a collision. Example:

```text
ticket-1423-2026-10-24-01.png
ticket-1423-2026-10-24-02.png
ticket-1423-2026-10-24-03.png
```

For large batches, display progress such as `Saving images: 4/12` and avoid unnecessarily blocking the interface.

Partial failure must preserve successful images. Report success/failure counts and identify each failed item.

### Future batch annotation

**Paste images and annotate** should save the entire batch, open the first image, and offer **Save & Next** to review subsequent images.

## 11. Duplicate detection

Calculate SHA-256 from the complete binary image content. Do not rely on file name, size, timestamps, or resolution alone.

| Duplicate action         | Behavior                                                           |
| ------------------------ | ------------------------------------------------------------------ |
| Reuse existing — default | Create no new image file; insert a reference to an existing match. |
| Ask                      | Show matching paths and offer Reuse, Save duplicate, or Cancel.    |
| Always save              | Save a separate file with a unique name.                           |

When multiple files have the same content, prefer:

1. A match in the configured image attachment folder.
2. An image associated with the current note.
3. The image closest to the note's folder.
4. The first remaining valid match.

In Ask mode, let the user choose among matching paths.

### Local index

Maintain a rebuildable local hash index to avoid hashing every file on every paste. The index is a cache, never the sole source of truth: validate that matches still exist and have matching content.

Update the index when an image is created, deleted, renamed, or modified. Provide **Rebuild image duplicate index**.

```ts
interface ImageHashEntry {
  hash: string;
  path: string;
  size: number;
  modifiedAt?: number;
}

interface DuplicateResult {
  duplicate: boolean;
  existingPaths: string[];
}
```

An edited or annotated image with different bytes is a different image, even if it was derived from an existing source.

### Future duplicate features

- Optional perceptual hashing for visually similar images, including different formats or compression levels.
- **Find duplicate images** to present groups across the vault.
- Explicit Keep first, Keep selected, Replace references, and Delete duplicates actions.
- Update relevant references before deleting duplicates.
- Never perform automatic destructive cleanup.

## 12. Settings groups

| Group        | Settings                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------- |
| Clipboard    | Copy mode, preserve formatting, preserve resize, Movidesk optimization                       |
| Editor       | Default color, line width, font size, save mode, annotation folder, editable annotation data |
| Image sizing | Default width, preserve explicit height, normalize on ticket copy, presets                   |
| Paste        | Multi-image paste, default width, blank lines, naming template, image folder                 |
| Duplicates   | Enable detection, Reuse / Ask / Always save, local hash index                                |
| QA           | Auto-increment markers, screenshot naming, quick tools, redaction style                      |

## 13. Suggested architecture

Fabric.js is the suggested editor library. Separate responsibilities into modules rather than coupling clipboard, image editing, and vault operations.

```text
src/
  editor/
    ImageEditorView.ts
    CanvasManager.ts
    tools/           # Select, arrow, rectangle, ellipse, text, freehand,
                     # number marker, highlight, and redaction
    history/HistoryManager.ts
    persistence/AnnotationSerializer.ts
    export/ImageExporter.ts
  sizing/
    ImageSizeNormalizer.ts
    ImageEmbedParser.ts
    ImageSizeSettings.ts
  paste/
    ClipboardImageReader.ts
    MultiImagePasteHandler.ts
    ImageFileWriter.ts
    ImageNamingService.ts
  duplicates/
    ImageHasher.ts
    DuplicateIndex.ts
    DuplicateDetector.ts
    DuplicateResolver.ts
  clipboard/
    ClipboardWriter.ts
    HtmlClipboard.ts
    ImageClipboard.ts
```

This is a suggested module breakdown, not a requirement that each responsibility have its own file. The README documents the implemented structure.

## 14. Delivery stages

| Stage                              | Scope                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| MVP 0.1 — Rich Copy                | Markdown to HTML, formatted text, embedded images, resize, Movidesk compatibility target |
| MVP 0.2 — Image Size Normalization | Note/selection scope, command, hotkey, one-step undo                                     |
| MVP 0.3 — Multi-image Paste        | Batch detection, ordered saves and embeds, unique names, optional default width          |
| MVP 0.4 — Duplicate Detection      | SHA-256, local index, reuse, Ask / Always save, index rebuild                            |
| MVP 0.5 — Basic QA Editor          | Selection, arrows, rectangles, text, colors, undo/redo, saving                           |
| MVP 0.6 — QA Tools                 | Number markers, highlighting, redaction, cropping, Save & Copy                           |
| MVP 0.7 — Non-destructive Editing  | Editable `.qrc.json` sidecars                                                            |

## 15. Acceptance criteria

### Multi-image paste

Given four screenshots in the clipboard and automatic width set to 600 px, one paste should insert all four in order, for example:

```md
![[ticket-1500-01.png|600]]

![[ticket-1500-02.png|600]]

![[ticket-1500-03.png|600]]

![[ticket-1500-04.png|600]]
```

### Duplicate reuse

Given `attachments/login-error.png` already exists and the user pastes byte-identical image content with Reuse existing enabled:

1. Detect the matching SHA-256.
2. Do not create another image file.
3. Reuse `attachments/login-error.png`.
4. Insert the corresponding embed.

Do not create `login-error-1.png` in this case.

### End-to-end evidence workflow

The user must be able to paste multiple screenshots, avoid redundant image files, normalize them to 600 px, annotate a screenshot with a rectangle/arrow/text, save it, select the analysis, run Copy for Ticket, and paste into Movidesk.

The resulting content should contain formatted text, screenshots, annotated images, consistent dimensions, and correct ordering, without visible Markdown image references or unnecessary duplicate files.

## 16. Future screenshot integration

A dedicated **Paste screenshot and annotate** command may support this flow:

```text
Win+Shift+S → Ctrl+Shift+V → Save screenshot → Check duplicates
           → Insert embed → Open annotation editor
```

This shortcut workflow, batch Save & Next, perceptual matching, guided cleanup, blur/pixelation, section-level sizing, and JPEG/WebP export are future work, not initial MVP requirements.
