"use client";

import { useEffect, useState } from "react";

/**
 * The hero's moving backdrop.
 *
 * Two Vimeo videos, one shot for wide screens and one for tall ones, played
 * through Vimeo's `background=1` mode — autoplay, loop, muted, no controls,
 * no chrome. `dnt=1` asks Vimeo not to set tracking cookies, which is the
 * right default for a nonprofit's homepage.
 *
 * It mounts after first paint and picks one video rather than rendering both,
 * so the Vimeo player never competes with the hero for bandwidth and a phone
 * never downloads the desktop cut. The cream backdrop shows until the video
 * is there, which is also what you get under `prefers-reduced-motion` — an
 * autoplaying video is precisely what that setting is about.
 *
 * ⚠️ ASPECT RATIOS ARE ASSUMED. An iframe can't be `object-fit: cover`d, so
 * the frame is oversized past the hero on whichever axis needs it, and that
 * maths needs the video's real shape. If either video is cropped wrongly —
 * squashed, or with bars — correct its `aspect` below and nothing else
 * changes.
 */

const VIDEOS = {
  desktop: { id: "1214855726", aspect: 16 / 9 },
  mobile: { id: "1214855728", aspect: 9 / 16 },
} as const;

/** Below this we use the tall cut. Matches Tailwind's `md`. */
const WIDE_FROM = 768;

function src(id: string) {
  const params = new URLSearchParams({
    background: "1",
    autoplay: "1",
    loop: "1",
    muted: "1",
    autopause: "0",
    dnt: "1",
  });
  return `https://player.vimeo.com/video/${id}?${params}`;
}

export default function HeroVideo() {
  const [video, setVideo] = useState<(typeof VIDEOS)[keyof typeof VIDEOS] | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const wide = window.matchMedia(`(min-width: ${WIDE_FROM}px)`);
    const pick = () => setVideo(wide.matches ? VIDEOS.desktop : VIDEOS.mobile);
    pick();
    wide.addEventListener("change", pick);
    return () => wide.removeEventListener("change", pick);
  }, []);

  if (!video) return null;

  return (
    <iframe
      key={video.id}
      src={src(video.id)}
      title=""
      aria-hidden="true"
      tabIndex={-1}
      allow="autoplay; fullscreen"
      // Oversize past whichever edge needs it so the video covers the hero at
      // any viewport shape — the section clips the overflow.
      style={{
        width: `max(100vw, calc(100svh * ${video.aspect}))`,
        height: `max(100svh, calc(100vw / ${video.aspect}))`,
      }}
      className="pointer-events-none absolute left-1/2 top-1/2 -z-20 -translate-x-1/2 -translate-y-1/2 border-0"
    />
  );
}
