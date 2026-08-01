"use client";

import { useEffect, useState } from "react";

/**
 * The hero's moving backdrop.
 *
 * One Vimeo video at every size, played through Vimeo's `background=1` mode —
 * autoplay, loop, muted, no controls, no chrome. `dnt=1` asks Vimeo not to set
 * tracking cookies, which is the right default for a nonprofit's homepage.
 *
 * There is a second, portrait cut of this at Vimeo id 1214855728. It isn't
 * wired up: this is the one being tried first. To bring it back, pick between
 * the two on a `(min-width: 768px)` media query and give each its own aspect.
 *
 * It mounts after first paint rather than server-side, so the Vimeo player
 * never competes with the hero for the first bytes. The cream backdrop shows
 * until the video is there — which is also all you get under
 * `prefers-reduced-motion`, since an autoplaying video is precisely what that
 * setting is about.
 */

const VIDEO = {
  id: "1214855726",
  /**
   * ⚠️ ASSUMED. An iframe can't be `object-fit: cover`d, so the frame is
   * oversized past the hero on whichever axis needs it — and that maths needs
   * the video's real shape. If the backdrop looks squashed, or shows bars,
   * this is the number to correct and nothing else changes.
   */
  aspect: 16 / 9,
} as const;

const SRC = `https://player.vimeo.com/video/${VIDEO.id}?${new URLSearchParams({
  background: "1",
  autoplay: "1",
  loop: "1",
  muted: "1",
  autopause: "0",
  dnt: "1",
})}`;

export default function HeroVideo() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <iframe
      src={SRC}
      title=""
      aria-hidden="true"
      tabIndex={-1}
      allow="autoplay; fullscreen"
      style={{
        width: `max(100vw, calc(100svh * ${VIDEO.aspect}))`,
        height: `max(100svh, calc(100vw / ${VIDEO.aspect}))`,
      }}
      className="pointer-events-none absolute left-1/2 top-1/2 -z-20 -translate-x-1/2 -translate-y-1/2 border-0"
    />
  );
}
