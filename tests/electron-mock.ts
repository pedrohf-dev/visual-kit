export const clipboard = {
  last: { html: "", text: "" },
  write(data: { html?: string; text?: string }) {
    this.last = { html: data.html || "", text: data.text || "" };
  },
  writeImage() {},
};
export const nativeImage = {
  createFromDataURL: (_url: string) => ({ isEmpty: () => false }),
};
