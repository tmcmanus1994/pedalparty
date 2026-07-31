/**
 * The Pedal Party brand palette — these seven hex values and nothing else.
 *
 * No darkened "text-safe" variants, no lifted tints. If a brand colour is
 * unreadable in a given spot, pick a DIFFERENT brand colour; never invent a
 * shade of one.
 *
 * Foreground rule: white on every fill except yellow, which takes ink.
 * One rule, applied everywhere a brand colour is used as a background.
 */

export const BRAND = {
  purple: "#5f13a9", // the main colour
  magenta: "#bc1184",
  red: "#e01226",
  orange: "#e18b12",
  yellow: "#e1c718",
  green: "#33b754",
  teal: "#359fb5",
} as const;

export const INK = "#222222";
export const PAPER = "#ffffff";

/** Foreground for text sitting ON a brand fill. */
export function onBrand(fill: string): string {
  return fill.toLowerCase() === BRAND.yellow ? INK : PAPER;
}

/**
 * Brand colours that stay legible as TEXT on the cream/paper background
 * (>= 3:1 at display size). Orange, green and yellow are too light to carry
 * type on a light surface — they are fill colours, so use them as fills.
 */
export const BRAND_ON_LIGHT = {
  purple: BRAND.purple, // 9.76:1
  magenta: BRAND.magenta, // 5.91:1
  red: BRAND.red, // 4.90:1
  teal: BRAND.teal, // 3.10:1
} as const;

/**
 * Brand colours that stay legible as TEXT on the purple band (>= 3:1 at
 * display size). Red and magenta sit too close to purple to read.
 */
export const BRAND_ON_PURPLE = {
  yellow: BRAND.yellow, // 5.75:1
  green: BRAND.green, // 3.74:1
  orange: BRAND.orange, // 3.67:1
  teal: BRAND.teal, // 3.15:1
} as const;

export type Swatch = { name: string; fill: string; on: string };

/**
 * The one sequence. Every repeated element set — countdown blocks, ticker
 * words, Da Plan steps, social cards — indexes into it by position.
 */
export const SPECTRUM: Swatch[] = (
  ["magenta", "red", "orange", "yellow", "green", "teal"] as const
).map((name) => ({ name, fill: BRAND[name], on: onBrand(BRAND[name]) }));

/** Swatch at `i`, wrapping around the spectrum. */
export function swatch(i: number): Swatch {
  return SPECTRUM[((i % SPECTRUM.length) + SPECTRUM.length) % SPECTRUM.length];
}
