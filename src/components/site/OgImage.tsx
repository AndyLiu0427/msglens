import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Shared social-card renderer, generated once per locale at build time.
 *
 * Deliberately Latin-only, including on the Chinese pages: Satori needs an
 * embedded font for every glyph it draws, and shipping a multi-megabyte CJK
 * font into the build to render one image is a poor trade. The card's job here
 * is the mark, the product name and the claim — all of which read the same in
 * either locale.
 */
export function renderOgImage(claim: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #1b1b21 0%, #241f3d 55%, #2b2358 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 17,
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
              <rect
                x="14"
                y="20"
                width="36"
                height="24"
                rx="5"
                stroke="#fff"
                strokeWidth="4"
              />
              <path
                d="M16 24l14.4 9.6a3 3 0 0 0 3.2 0L48 24"
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {SITE.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              maxWidth: 940,
            }}
          >
            Open .msg files without Outlook
          </div>
          <div style={{ fontSize: 32, color: "#b9b6d4", maxWidth: 900, lineHeight: 1.35 }}>
            {claim}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.09)",
              border: "1px solid rgba(255,255,255,0.16)",
              fontSize: 24,
              color: "#d9d7ee",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect
                x="4"
                y="10"
                width="16"
                height="10.5"
                rx="2.5"
                fill="none"
                stroke="#6ee7a8"
                strokeWidth="1.8"
              />
              {/* fill="none" is required: Satori fills an unfilled path, which
                  turns the padlock shackle into a solid blob. */}
              <path d="M8 10V7a4 4 0 1 1 8 0v3" fill="none" stroke="#6ee7a8" strokeWidth="1.8" />
            </svg>
            Files never leave your device
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
