"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { setLogoProgress } from "@/lib/logoProgress";

/**
 * The hero logo flies up into the centre of the header as you scroll through
 * the hero, shrinking as it goes, then pins there.
 *
 * How it works: the logo is lifted out of flow into `position: fixed` and a
 * same-sized spacer holds the hero layout open, so nothing jumps. Each frame
 * we interpolate between where the logo *would* be if it just scrolled with
 * the page and where it should land in the header — so at scroll 0 it sits
 * exactly on the spacer, and by the time the hero has scrolled past it is
 * centred in the header. Only `transform` changes, so there is no layout work
 * per frame.
 *
 * Under `prefers-reduced-motion` none of this runs: the logo stays in flow in
 * the hero and simply scrolls away.
 *
 * The pinned mark sits in the middle of the header, where the open menu panel
 * would collide with it on a narrow screen — so it fades out while the menu is
 * open, driven by `data-menu-open` on <html> (see SiteHeader + globals.css).
 *
 * One wrinkle: the hero section is `isolate`, which makes it a stacking
 * context, and a fixed child cannot escape one — the header would always paint
 * over the mark. So on mount the node is reparented to <body>, where it becomes
 * a sibling of the header and wins on DOM order. It is server-rendered inside
 * the <h1> first, so it is present for the initial paint and stays the LCP
 * element; the <h1> keeps a visually-hidden "Pedal Party" for its accessible
 * name, and the moved image is decorative.
 */

/**
 * Height the mark settles at inside the header, in px. Smaller on narrow
 * screens, where the header's email address reaches toward the centre.
 */
function pinnedHeight() {
  return window.innerWidth < 480 ? 32 : 40;
}

/**
 * Below this the mark doesn't fly at all — it stays in the hero and scrolls
 * away like everything else. Matches Tailwind's `md`. On a phone the header is
 * already crowded, the flight is a lot of per-frame work on the weakest
 * hardware, and the mark is tiny by the time it would land.
 */
const FLY_FROM = 768;

/**
 * Smoothstep. Gentle at both ends, so the mark tracks the page naturally as it
 * leaves the hero and settles into the header rather than darting up front.
 */
function ease(t: number) {
  return t * t * (3 - 2 * t);
}

export default function ScrollLogo({
  children,
  aspect,
}: {
  children: ReactNode;
  /** width / height of the artwork, so the spacer reserves the right box. */
  aspect: number;
}) {
  const spacerRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);

  // useLayoutEffect so a page restored mid-scroll is positioned before paint.
  useLayoutEffect(() => {
    const spacer = spacerRef.current;
    const mover = moverRef.current;
    if (!spacer || !mover) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia(`(min-width: ${FLY_FROM}px)`).matches) return;

    const headerH =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
    const endCenterY = headerH / 2;

    let startCenterDocY = 0;
    let startW = 0;
    let startH = 0;
    let travel = 1;
    let frame = 0;
    let pinned = pinnedHeight();

    /** Re-read the spacer's geometry. Cheap, and only on resize. */
    const measure = () => {
      // Measure with the mover out of the way — the spacer is the source of truth.
      const r = spacer.getBoundingClientRect();
      startW = r.width;
      startH = r.height;
      startCenterDocY = r.top + window.scrollY + r.height / 2;
      travel = Math.max(1, startCenterDocY - endCenterY);
      pinned = pinnedHeight();
      mover.style.width = `${startW}px`;
      mover.style.height = `${startH}px`;
    };

    const paint = () => {
      frame = 0;
      const y = window.scrollY;
      const e = ease(Math.min(1, Math.max(0, y / travel)));

      // Blend the natural scrolled position toward the header slot.
      const centerY = (startCenterDocY - y) * (1 - e) + endCenterY * e;
      const centerX = window.innerWidth / 2;
      const scale = startH ? (startH * (1 - e) + pinned * e) / startH : 1;

      mover.style.transform =
        `translate3d(${centerX - startW / 2}px, ${centerY - startH / 2}px, 0) scale(${scale})`;

      // The mark's animation scrubs on the same number, so the wheels finish
      // their turn exactly as it lands in the header (see BrandLottie).
      setLogoProgress(e);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const onResize = () => {
      measure();
      paint();
    };

    // Escape the hero's stacking context (see the note above), then lift out
    // of flow and place before the browser paints.
    if (mover.parentElement !== document.body) document.body.appendChild(mover);
    mover.style.position = "fixed";
    mover.style.left = "0";
    mover.style.top = "0";
    mover.style.transformOrigin = "center center";
    mover.style.willChange = "transform";
    // Same z as the fixed header but later in the DOM, so the mark paints on
    // top of the header's background instead of behind it.
    mover.style.zIndex = "50";
    // The mark has left the flow, so the spacer takes over its box.
    spacer.style.display = "block";
    measure();
    paint();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // The mark is a raster image; once decoded its box can settle.
    const imgs = Array.from(mover.querySelectorAll("img"));
    Promise.all(imgs.map((i) => (i.complete ? null : i.decode().catch(() => null)))).then(onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) window.cancelAnimationFrame(frame);
      mover.remove();
    };
  }, []);

  // Keep the geometry honest if the viewport box changes for any other reason.
  useEffect(() => {
    const spacer = spacerRef.current;
    if (!spacer || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => window.dispatchEvent(new Event("resize")));
    ro.observe(spacer);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      {/* Holds the hero layout open once the mark goes fixed — and only then.
          It starts collapsed so that when the flight doesn't run at all (a
          phone, or reduced motion) the hero doesn't carry a logo-sized hole
          above a logo. */}
      <div
        ref={spacerRef}
        aria-hidden="true"
        className="mx-auto w-[min(74vw,24rem,46svh)] max-w-full"
        style={{ aspectRatio: String(aspect), display: "none" }}
      />
      {/* Decorative once it moves — the <h1> carries the name. */}
      <div
        ref={moverRef}
        aria-hidden="true"
        className="scroll-logo mx-auto w-[min(74vw,24rem,46svh)] max-w-full"
      >
        {children}
      </div>
    </>
  );
}
