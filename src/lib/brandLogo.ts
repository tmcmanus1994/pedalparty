import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Finds the Pedal Party logo in /public/images at build time.
 *
 * Drop the artwork in as any of the names below and the hero switches from the
 * "Pedal Party" wordmark to the logo automatically — no code change. SVG is
 * preferred (sharpest at hero size); PNG/WEBP work too.
 *
 * Server-only: this reads the filesystem, so it may only be imported from a
 * server component.
 */

const CANDIDATES = [
  "logo.svg",
  "logo.png",
  "logo.webp",
  "pedal-party-logo.svg",
  "pedal-party-logo.png",
  "pedalparty-logo.svg",
  "pedalparty-logo.png",
];

export type BrandLogo = {
  src: string;
  /** Intrinsic size, when we can read it — lets the browser reserve space. */
  width?: number;
  height?: number;
};

/** PNG: width/height are big-endian uint32s at bytes 16 and 20 of the IHDR. */
function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** SVG: prefer the viewBox, fall back to unitless width/height attributes. */
function svgSize(text: string): { width: number; height: number } | null {
  const viewBox = text.match(/viewBox\s*=\s*["']\s*[-\d.]+[,\s]+[-\d.]+[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (viewBox) return { width: Number(viewBox[1]), height: Number(viewBox[2]) };

  const w = text.match(/\bwidth\s*=\s*["']([\d.]+)(px)?["']/i);
  const h = text.match(/\bheight\s*=\s*["']([\d.]+)(px)?["']/i);
  if (w && h) return { width: Number(w[1]), height: Number(h[1]) };
  return null;
}

export function findBrandLogo(): BrandLogo | null {
  const dir = join(process.cwd(), "public", "images");

  for (const name of CANDIDATES) {
    const file = join(dir, name);
    if (!existsSync(file)) continue;

    const logo: BrandLogo = { src: `/images/${name}` };
    try {
      if (name.endsWith(".svg")) {
        Object.assign(logo, svgSize(readFileSync(file, "utf8")) ?? {});
      } else if (name.endsWith(".png")) {
        Object.assign(logo, pngSize(readFileSync(file)) ?? {});
      }
    } catch {
      // Dimensions are a nicety, not a requirement — render without them.
    }
    return logo;
  }

  return null;
}
