"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades a hero element out as the page scrolls away from it, drifting it up
 * slightly on the way. Companion to ScrollLogo: the mark flies to the header
 * while everything around it dissolves.
 *
 * `speed` scales how quickly this element goes relative to the others — the
 * badge leaves first, the buttons last, so the hero empties from the top down.
 *
 * Frozen under `prefers-reduced-motion`: the content just scrolls away.
 */
export default function HeroFade({
  children,
  speed = 1,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const paint = () => {
      frame = 0;
      // Fade across roughly the top half of the viewport's worth of scroll,
      // so the hero is empty by the time the ticker reaches the top.
      const span = Math.max(1, window.innerHeight * 0.45);
      const p = Math.min(1, Math.max(0, (window.scrollY * speed) / span));
      el.style.opacity = String(1 - p);
      el.style.transform = `translate3d(0, ${-p * 28}px, 0)`;
      // Don't leave invisible buttons catching clicks.
      el.style.pointerEvents = p > 0.9 ? "none" : "";
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    el.style.willChange = "opacity, transform";
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
