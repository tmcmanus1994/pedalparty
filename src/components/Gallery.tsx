"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { gallery } from "@/lib/content";
import { GALLERY_PHOTOS, type GalleryPhoto } from "@/lib/galleryPhotos";

/**
 * Gallery — an endless strip of ride photos.
 *
 * Every frame is built to fit its own photo rather than crop it: the strip
 * runs at one height and each tile is exactly as wide as its picture needs, so
 * portrait phone shots stay tall and narrow while the landscape ones stretch
 * out. Nothing is cut off.
 *
 * The list is duplicated once and the scroll position wraps by exactly one
 * pass, so it loops forever with no seam. Drag to scroll, pause on hover or
 * focus, tap for the full picture.
 */

/** Time-based so it runs at the same speed on 60Hz and 120Hz screens. */
const AUTO_SCROLL_PX_PER_SEC = 26;

export default function Gallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const dragRef = useRef({ active: false, moved: 0, startX: 0, startScroll: 0 });
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);

  // Two passes of the same photos; the wrap below makes the seam invisible.
  const run = [...GALLERY_PHOTOS, ...GALLERY_PHOTOS];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    /**
     * The distance from a photo to its own copy in the second pass. Measured
     * off the DOM rather than derived from `scrollWidth / 2`, which would fold
     * in the track's own padding and leave a visible jump at the seam.
     */
    let period = 0;
    const measure = () => {
      const first = el.children[0] as HTMLElement | undefined;
      const twin = el.children[GALLERY_PHOTOS.length] as HTMLElement | undefined;
      period = first && twin ? twin.offsetLeft - first.offsetLeft : 0;
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const firstTile = el.children[0];
    if (firstTile) ro.observe(firstTile);

    // scrollLeft is kept in a plain number so sub-pixel steps accumulate
    // instead of being rounded away by the browser every frame.
    let pos = el.scrollLeft;
    let last = 0;
    // Browsers clamp scrollLeft at 0, so a backward wrap can only be detected
    // once we've actually left the start.
    let leftTheStart = false;

    let raf = 0;
    const step = (ts: number) => {
      const dt = last ? Math.min((ts - last) / 1000, 0.1) : 0;
      last = ts;

      // A drag, wheel or keyboard scroll moved it out from under us — follow.
      if (Math.abs(el.scrollLeft - pos) > 1) pos = el.scrollLeft;

      if (!still.matches && !pausedRef.current && !dragRef.current.active) {
        pos += AUTO_SCROLL_PX_PER_SEC * dt;
      }

      if (period > 0) {
        if (pos > 1) leftTheStart = true;
        let shift = 0;
        if (pos >= period) shift = -period;
        else if (leftTheStart && pos <= 0) shift = period;
        if (shift) {
          pos += shift;
          // Keep an in-progress drag continuous across the seam.
          dragRef.current.startScroll += shift;
        }
      } else {
        measure();
      }

      if (Math.abs(el.scrollLeft - pos) > 0.01) el.scrollLeft = pos;
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // Lightbox: Escape to close, lock body scroll while open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    dragRef.current = { active: true, moved: 0, startX: e.clientX, startScroll: el.scrollLeft };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;
    const dx = e.clientX - drag.startX;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    el.scrollLeft = drag.startScroll - dx;
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  /** A drag that moved shouldn't also open the lightbox on release. */
  const openIfNotDragging = useCallback((photo: GalleryPhoto) => {
    if (dragRef.current.moved > 6) return;
    setLightbox(photo);
  }, []);

  return (
    <section id="gallery" className="band scroll-mt-24 overflow-hidden bg-cream">
      <div className="shell">
        <Reveal className="section-head">
          <h2 className="section-title">
            {gallery.headingLead}
            <span style={{ color: "#e01226" }}>{gallery.headingAccent}</span>
          </h2>
          <p className="sub-section">{gallery.sub}</p>
        </Reveal>
      </div>

      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        onFocusCapture={() => (pausedRef.current = true)}
        onBlurCapture={() => (pausedRef.current = false)}
        className="no-scrollbar section-body flex cursor-grab items-center gap-5 overflow-x-auto overscroll-x-contain px-5 py-5 active:cursor-grabbing sm:gap-7 sm:px-8"
        style={{ "--photo-h": "15rem" } as React.CSSProperties}
        aria-label="Photos from past rides"
      >
        {run.map((photo, i) => {
          const original = i < GALLERY_PHOTOS.length;
          return (
            <button
              key={`${photo.src}-${i}`}
              type="button"
              onClick={() => openIfNotDragging(photo)}
              className="shrink-0 rounded-[10px]"
              // The second pass is the same pictures again — one set is enough
              // for a screen reader, and the duplicates aren't tab stops.
              aria-hidden={original ? undefined : true}
              tabIndex={original ? 0 : -1}
              aria-label={original ? `Open photo: ${photo.alt}` : undefined}
            >
              <span
                className="sticker block rounded-[10px] border-[3px] border-ink bg-paper p-2.5 pb-7 shadow-[var(--card-shadow-sm)] transition-transform duration-200 hover:-translate-y-1"
                style={{ "--tilt": `${i % 2 === 0 ? -2.5 : 2.5}deg` } as React.CSSProperties}
              >
                {/* Fixed height, natural width — the frame fits the photo. */}
                <img
                  src={photo.src}
                  alt={original ? photo.alt : ""}
                  width={photo.width}
                  height={photo.height}
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  className="block h-[var(--photo-h)] w-auto rounded-[4px] border-2 border-ink sm:h-[21rem]"
                />
              </span>
            </button>
          );
        })}
      </div>

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt}
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/85 p-4 sm:p-6"
        >
          <div
            className="card max-h-[92vh] max-w-[min(94vw,52rem)] overflow-hidden p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              width={lightbox.width}
              height={lightbox.height}
              className="mx-auto max-h-[76vh] w-auto max-w-full rounded-[8px] border-2 border-ink object-contain"
            />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="btn btn-secondary mt-3 w-full !min-h-[44px]"
              autoFocus
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
