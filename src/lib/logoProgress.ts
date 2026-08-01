/**
 * How far the hero mark is along its flight to the header: 0 at rest in the
 * hero, 1 pinned in the header.
 *
 * ScrollLogo already computes this every frame to position the mark. The
 * Lottie needs the same number to scrub its wheel-spin, and there is no
 * component relationship between them worth inventing — ScrollLogo owns the
 * geometry, the Lottie owns the drawing. A three-line store keeps both off
 * React's render path, which matters when the value changes 60 times a second.
 */

let progress = 0;
const listeners = new Set<(p: number) => void>();

export function setLogoProgress(next: number): void {
  if (next === progress) return;
  progress = next;
  for (const fn of listeners) fn(next);
}

export function getLogoProgress(): number {
  return progress;
}

/** Subscribe. Fires immediately with the current value, returns an unsubscribe. */
export function onLogoProgress(fn: (p: number) => void): () => void {
  listeners.add(fn);
  fn(progress);
  return () => {
    listeners.delete(fn);
  };
}
