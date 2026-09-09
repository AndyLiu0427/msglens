/**
 * Minimal RGBA PNG encoder and the MsgLens mark.
 *
 * Hand-rolled rather than pulling in an image library: the only raster assets
 * this project needs are one app icon and one small logo for the sample
 * message, and both are a flat shape plus a glyph.
 */

import { deflateSync } from "node:zlib";

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

export function encodePng(width: number, height: number, rgba: Buffer): Buffer {
  const chunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  // 10..12 — compression, filter, interlace: all 0.

  // Every scanline is prefixed with its filter type (0 = None).
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const ACCENT: [number, number, number] = [79, 70, 229];

export interface MarkOptions {
  size: number;
  /**
   * Corner radius as a fraction of size. Use 0 for the iOS app icon — the
   * system applies its own mask and a pre-rounded icon shows dark corners.
   */
  cornerRatio: number;
  /** 4x supersampling smooths the curves without a rasteriser. */
  samples?: number;
}

/**
 * The MsgLens mark: accent rounded square with an envelope knocked out of it.
 * Matches the header logo and `src/app/icon.svg`.
 */
export function renderMark({ size, cornerRatio, samples = 4 }: MarkOptions): Buffer {
  const hi = size * samples;
  const radius = hi * cornerRatio;
  const rgba = Buffer.alloc(size * size * 4);

  // Envelope geometry, in the supersampled space.
  const bx0 = hi * 0.22;
  const bx1 = hi * 0.78;
  const by0 = hi * 0.32;
  const by1 = hi * 0.68;
  const stroke = hi * 0.045;
  const corner = hi * 0.075;
  const mid = (bx0 + bx1) / 2;
  const flapSlope = (by1 - by0) * 0.45 / ((bx1 - bx0) / 2);

  const insideRounded = (x: number, y: number) => {
    if (radius <= 0) return true;
    const cx = Math.min(Math.max(x, radius), hi - radius);
    const cy = Math.min(Math.max(y, radius), hi - radius);
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
  };

  // Rounded-rect outline: inside the outer shape but not the inner one.
  const onRoundedRectBorder = (x: number, y: number) => {
    const within = (inset: number) => {
      const x0 = bx0 + inset;
      const x1 = bx1 - inset;
      const y0 = by0 + inset;
      const y1 = by1 - inset;
      if (x < x0 || x > x1 || y < y0 || y > y1) return false;
      const r = Math.max(corner - inset, 0);
      const cx = Math.min(Math.max(x, x0 + r), x1 - r);
      const cy = Math.min(Math.max(y, y0 + r), y1 - r);
      return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2 || r === 0;
    };
    return within(0) && !within(stroke);
  };

  // The flap: two diagonals meeting at the horizontal centre.
  const onFlap = (x: number, y: number) => {
    if (x < bx0 + stroke || x > bx1 - stroke) return false;
    const expected = by0 + stroke * 0.8 + Math.abs(x - mid) * -flapSlope + (by1 - by0) * 0.28;
    return Math.abs(y - expected) < stroke * 0.62 && y > by0 && y < by1;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let covered = 0;
      let white = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x * samples + sx + 0.5;
          const py = y * samples + sy + 0.5;
          if (!insideRounded(px, py)) continue;
          covered++;
          if (onRoundedRectBorder(px, py) || onFlap(px, py)) white++;
        }
      }
      const total = samples * samples;
      if (covered === 0) continue;

      const alpha = Math.round((covered / total) * 255);
      const mix = white / covered;
      const o = (y * size + x) * 4;
      rgba[o] = Math.round(ACCENT[0] + (255 - ACCENT[0]) * mix);
      rgba[o + 1] = Math.round(ACCENT[1] + (255 - ACCENT[1]) * mix);
      rgba[o + 2] = Math.round(ACCENT[2] + (255 - ACCENT[2]) * mix);
      rgba[o + 3] = alpha;
    }
  }

  return encodePng(size, size, rgba);
}
