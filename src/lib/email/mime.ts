/** Extension -> MIME type, for sources that omit the content type. */
const BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  txt: "text/plain",
  rtf: "application/rtf",
  html: "text/html",
  htm: "text/html",
  xml: "application/xml",
  json: "application/json",
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  gz: "application/gzip",
  tar: "application/x-tar",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  tif: "image/tiff",
  tiff: "image/tiff",
  heic: "image/heic",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  webm: "video/webm",
  msg: "application/vnd.ms-outlook",
  eml: "message/rfc822",
  ics: "text/calendar",
  vcf: "text/vcard",
};

export function extensionOf(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : "";
}

export function guessMimeType(fileName: string, declared?: string): string {
  if (declared && declared !== "application/octet-stream") return declared;
  return BY_EXTENSION[extensionOf(fileName)] ?? declared ?? "application/octet-stream";
}

/** Coarse bucket used to pick the attachment icon and preview affordance. */
export type AttachmentKind =
  | "image"
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "archive"
  | "audio"
  | "video"
  | "email"
  | "text"
  | "other";

export function attachmentKind(fileName: string, mimeType: string): AttachmentKind {
  const ext = extensionOf(fileName);
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (ext === "msg" || ext === "eml" || mimeType === "message/rfc822") return "email";
  if (["doc", "docx", "odt", "rtf", "pages"].includes(ext)) return "document";
  if (["xls", "xlsx", "ods", "csv", "numbers"].includes(ext)) return "spreadsheet";
  if (["ppt", "pptx", "odp", "key"].includes(ext)) return "presentation";
  if (["zip", "rar", "7z", "gz", "tar", "bz2"].includes(ext)) return "archive";
  if (mimeType.startsWith("text/")) return "text";
  return "other";
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 10 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
