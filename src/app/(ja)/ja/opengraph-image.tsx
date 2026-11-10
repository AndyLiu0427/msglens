import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/components/site/OgImage";

export const alt = "MsgLens — open Outlook .msg files in your browser";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Required by `output: export` — rendered once at build time.
export const dynamic = "force-static";

export default function Image() {
  return renderOgImage(
    "Read .msg and .eml files with full formatting, inline images and attachments — parsed in your browser, never uploaded.",
  );
}
