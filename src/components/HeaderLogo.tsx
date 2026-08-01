"use client";

import { useEffect, useRef } from "react";
import type { BrandLogo } from "@/lib/brandLogo";

/**
 * The mark in the header, on phones.
 *
 * Above 768px the hero mark flies up and pins here itself, so this stays out
 * of the way entirely. Below it there is no flight — the mark scrolls off with
 * the hero — and this fades in behind it, so the header still carries the
 * brand once the hero has emptied.
 *
 * The fade window is derived from the same span HeroFade uses, so the two
 * can't drift: the header mark arrives as the hero text finishes dissolving,
 * rather than at some scroll position picked by hand.
 *
 * Under `prefers-reduced-motion` it simply doesn't appear — the hero mark
 * scrolls away and the header stays as it was.
 */

/** Matches ScrollLogo's breakpoint: above this the flying mark owns this slot. */
const MOBILE_UNDER = 768;

/** Matches ScrollLogo's `pinnedHeight()`, so both land the same size. */
function markHeight() {
  return window.innerWidth < 480 ? 32 : 40;
}

export default function HeaderLogo({ logo }: { logo: BrandLogo }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia(`(min-width: ${MOBILE_UNDER}px)`).matches) return;

    let frame = 0;

    const paint = () => {
      frame = 0;
      // HeroFade dissolves across `innerHeight * 0.45`. Come in over the tail
      // of that, so the header fills as the hero empties instead of after a
      // beat of neither.
      const span = Math.max(1, window.innerHeight * 0.45);
      const p = Math.min(1, Math.max(0, (window.scrollY - span * 0.8) / (span * 0.35)));
      el.style.opacity = String(p);
      el.style.height = `${markHeight()}px`;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    el.style.willChange = "opacity";
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      // Centred in the header, the same slot the flying mark lands in on
      // desktop. `md:hidden` keeps the two from ever both being here.
      className="header-logo pointer-events-none absolute left-1/2 top-1/2 h-10 -translate-x-1/2 -translate-y-1/2 opacity-0 md:hidden"
    >
      <picture>
        {logo.webp ? <source type="image/webp" srcSet={logo.webp} /> : null}
        <img src={logo.src} alt="" className="block h-full w-auto" />
      </picture>
    </div>
  );
}
