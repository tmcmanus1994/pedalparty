"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { onLogoProgress } from "@/lib/logoProgress";

/**
 * The animated mark.
 *
 * Three states, and only three:
 *   at rest      frame 0
 *   on hover     plays once, then settles back to frame 0
 *   on scroll    scrubbed by the flight to the header, so the wheels finish
 *                exactly one turn as the mark lands
 *
 * The artwork's two wheel layers rotate 0→360° over frames 0–38 and then hold
 * to frame 60, which is why the scrub maps onto the last *keyframe* rather
 * than the last frame — otherwise the spin would finish two-thirds of the way
 * up and the rest of the flight would be dead. It also means the resting pose
 * and the landed pose are the same drawing, so nothing jumps at either end.
 *
 * The static PNG renders first and stays until the player and the animation
 * have both arrived. That keeps the mark the LCP element and keeps 164 KB of
 * player and 153 KB of animation off the critical path — the hero paints
 * exactly as fast as it did before this existed. Hovering before it's ready
 * simply does nothing.
 *
 * Desktop only, and under `prefers-reduced-motion` not at all — in both cases
 * the PNG is the whole story. On a phone there is no hover to speak of
 * (`pointerenter` just means "tapped"), and the mark is small enough by the
 * time it lands that the wheels turning is lost anyway, so it isn't worth a
 * player and an animation over a mobile connection. The mark still flies to
 * the header everywhere — that's ScrollLogo's job, not this one's.
 */

const SRC = "/lottie/pedal-party.json";

/** Matches Tailwind's `md`. Below this the mark stays a still picture. */
const ANIMATE_FROM = 768;

type Player = {
  goToAndStop: (value: number, isFrame?: boolean) => void;
  goToAndPlay: (value: number, isFrame?: boolean) => void;
  addEventListener: (name: "complete", cb: () => void) => void;
  destroy: () => void;
};

export default function BrandLottie({ children }: { children: ReactNode }) {
  const holder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = holder.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Decided once, like reduced motion. Crossing the breakpoint mid-session
    // is rare and the worst it does is leave the animation loaded on a window
    // that got narrow.
    if (!window.matchMedia(`(min-width: ${ANIMATE_FROM}px)`).matches) return;

    let anim: Player | null = null;
    let dead = false;
    let unsubscribe: (() => void) | null = null;

    // Live values, not state — these change every animation frame.
    let progress = 0;
    let playing = false;
    /** Last frame that actually draws anything new. Filled in once loaded. */
    let lastFrame = 0;

    const settle = () => {
      playing = false;
      anim?.goToAndStop(progress >= 0.999 ? lastFrame : 0, true);
    };

    (async () => {
      try {
        const [{ default: lottie }, data] = await Promise.all([
          import("lottie-web/build/player/lottie_light"),
          fetch(SRC).then((r) => {
            if (!r.ok) throw new Error(`${SRC} responded ${r.status}`);
            return r.json();
          }),
        ]);
        if (dead) return;

        // After this frame nothing in the file changes, so it's where the
        // scrub should end. Read from the file rather than hard-coded, so a
        // re-export with different timing still behaves.
        lastFrame = lastKeyframe(data) || Number(data.op) || 0;

        anim = lottie.loadAnimation({
          container: mount,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData: data,
          rendererSettings: { progressiveLoad: false, preserveAspectRatio: "xMidYMid meet" },
        }) as unknown as Player;

        anim.addEventListener("complete", settle);
        anim.goToAndStop(0, true);
        setReady(true);

        unsubscribe = onLogoProgress((p) => {
          progress = p;
          const scrubbing = p > 0.001 && p < 0.999;
          if (scrubbing) {
            // Scroll wins over a hover that's mid-play.
            playing = false;
            anim?.goToAndStop(p * lastFrame, true);
          } else if (!playing) {
            anim?.goToAndStop(p >= 0.999 ? lastFrame : 0, true);
          }
        });
      } catch (err) {
        // The static mark is already on screen and stays there.
        console.error("[pedalparty] logo animation unavailable:", err);
      }
    })();

    const onEnter = () => {
      if (!anim || playing) return;
      if (progress > 0.001 && progress < 0.999) return; // mid-flight; scroll owns it
      playing = true;
      anim.goToAndPlay(0, true);
    };

    mount.addEventListener("pointerenter", onEnter);

    return () => {
      dead = true;
      mount.removeEventListener("pointerenter", onEnter);
      unsubscribe?.();
      anim?.destroy();
    };
  }, []);

  return (
    <div className="relative">
      {/* The static mark. Hidden once the animation is drawing the same thing,
          but left mounted so ScrollLogo's decode() measurement still resolves. */}
      <div className={ready ? "invisible" : undefined}>{children}</div>
      <div
        ref={holder}
        aria-hidden="true"
        className={ready ? "absolute inset-0" : "pointer-events-none absolute inset-0 opacity-0"}
      />
    </div>
  );
}

/** The largest keyframe time anywhere in the file, including inside precomps. */
function lastKeyframe(data: unknown): number {
  let last = 0;
  const visit = (layers: unknown) => {
    if (!Array.isArray(layers)) return;
    for (const layer of layers) {
      const ks = (layer as { ks?: Record<string, unknown> })?.ks;
      if (!ks) continue;
      for (const prop of Object.values(ks)) {
        const p = prop as { a?: number; k?: Array<{ t?: number }> };
        if (p?.a !== 1 || !Array.isArray(p.k)) continue;
        for (const key of p.k) if (typeof key?.t === "number") last = Math.max(last, key.t);
      }
    }
  };
  const d = data as { layers?: unknown; assets?: Array<{ layers?: unknown }> };
  visit(d.layers);
  for (const asset of d.assets ?? []) visit(asset.layers);
  return last;
}
