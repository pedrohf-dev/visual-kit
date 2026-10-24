export interface Settings {
  copyMode: "dedicated" | "smart" | "always";
  preserveFormatting: boolean;
  preserveResize: boolean;
  movidesk: boolean;
  color: string;
  lineWidth: number;
  fontSize: number;
  saveMode: "new" | "replace" | "copy";
  annotationFolder: string;
  editable: boolean;
  width: number;
  preserveHeight: boolean;
  normalizeCopy: boolean;
  ribbon: boolean;
  multiPaste: boolean;
  pasteWidth: boolean;
  blankLines: boolean;
  naming: string;
  folder: string;
  duplicates: boolean;
  duplicateAction: "reuse" | "ask" | "save";
  persistIndex: boolean;
  autoMarkers: boolean;
  quickTools: boolean;
}
export const defaults: Settings = {
  copyMode: "smart",
  preserveFormatting: true,
  preserveResize: true,
  movidesk: true,
  color: "#ef4444",
  lineWidth: 4,
  fontSize: 28,
  saveMode: "new",
  annotationFolder: "",
  editable: true,
  width: 600,
  preserveHeight: false,
  normalizeCopy: false,
  ribbon: false,
  multiPaste: true,
  pasteWidth: false,
  blankLines: true,
  naming: "{note}-{date}-{counter}",
  folder: "attachments",
  duplicates: true,
  duplicateAction: "reuse",
  persistIndex: true,
  autoMarkers: true,
  quickTools: true,
};
