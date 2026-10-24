interface ElectronClipboard {
  clipboard: {
    write(data: { html?: string; text?: string; image?: unknown }): void;
    writeImage(image: unknown): void;
  };
  nativeImage: { createFromDataURL(url: string): unknown };
}
function electron(): ElectronClipboard | null {
  try {
    return require("electron") as ElectronClipboard;
  } catch {
    return null;
  }
}
export async function writeRich(html: string, text: string) {
  const desktop = electron();
  if (desktop) {
    desktop.clipboard.write({ html, text });
    return;
  }
  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([text], { type: "text/plain" }),
    }),
  ]);
}
export async function writeImage(dataURL: string) {
  const desktop = electron();
  if (desktop) {
    desktop.clipboard.writeImage(
      desktop.nativeImage.createFromDataURL(dataURL),
    );
    return;
  }
  const blob = await (await fetch(dataURL)).blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
export function toDataURL(bytes: ArrayBuffer, mime: string): string {
  const array = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < array.length; i += 8192)
    binary += String.fromCharCode(...array.subarray(i, i + 8192));
  return `data:${mime};base64,${btoa(binary)}`;
}
export const imageMime = (ext: string) =>
  ({ jpg: "image/jpeg", jpeg: "image/jpeg", svg: "image/svg+xml" })[
    ext.toLowerCase()
  ] ?? `image/${ext.toLowerCase()}`;
