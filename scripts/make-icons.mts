/**
 * Generates the raster app icon.
 *
 * Run: npx tsx scripts/make-icons.mts
 * Output: src/app/apple-icon.png
 *
 * iOS does not accept an SVG touch icon, so `apple-icon.svg` is ignored by
 * Next's metadata convention and no link tag is emitted. The other sizes stay
 * as `src/app/icon.svg`, which every modern browser prefers anyway.
 */
import { writeFileSync } from "node:fs";
import { renderMark } from "./lib/png.mts";

// cornerRatio 0: iOS masks the icon itself, and pre-rounded corners show as
// dark notches against the system's own radius.
const png = renderMark({ size: 180, cornerRatio: 0 });
writeFileSync("src/app/apple-icon.png", png);
console.log(`wrote src/app/apple-icon.png — ${(png.length / 1024).toFixed(1)} KB`);
