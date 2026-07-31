/**
 * The rainbow, with rules (handoff §6.3).
 *
 * Any repeated element set — countdown blocks, stat badges, ticker words,
 * "Da Plan" step chips, social cards — cycles through this ONE sequence in
 * this ONE order. Index by position, never by hand.
 *
 * `fill` is the bright brand value. `on` is the foreground that clears
 * 4.5:1 against it (white on the dark half, ink on the light half), so every
 * text-bearing chip passes AA without breaking the poster look.
 * `text` is the darkened variant to use when the accent itself is type on a
 * light background (headline accent words, list markers).
 */

export type Swatch = {
  name: string;
  fill: string;
  on: string;
  text: string;
};

export const SPECTRUM: Swatch[] = [
  { name: "magenta", fill: "#bc1184", on: "#ffffff", text: "#bc1184" },
  { name: "red", fill: "#e01226", on: "#ffffff", text: "#c40e20" },
  { name: "orange", fill: "#e18b12", on: "#222222", text: "#a85f00" },
  { name: "yellow", fill: "#e1c718", on: "#222222", text: "#8a6d00" },
  { name: "green", fill: "#33b754", on: "#222222", text: "#1e7a38" },
  { name: "teal", fill: "#359fb5", on: "#222222", text: "#1f6e80" },
];

/** Swatch at `i`, wrapping around the spectrum. */
export function swatch(i: number): Swatch {
  return SPECTRUM[((i % SPECTRUM.length) + SPECTRUM.length) % SPECTRUM.length];
}
