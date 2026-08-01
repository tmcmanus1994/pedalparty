"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { LogoMark } from "./Icons";
import { gallery } from "@/lib/content";
import { swatch } from "@/lib/spectrum";

/**
 * Gallery — slow auto-scrolling strip of polaroid-framed photos.
 * Drag to scroll, pause on hover/focus/drag, lightbox on tap.
 *
 * ⚠️ Final photos come from @pedalpartylr (handoff §8 item 5). Until then this
 * renders honest placeholder tiles rather than stock photos: drop real entries
 * into GALLERY_PHOTOS and the strip picks them up with no other changes.
 */
export type GalleryPhoto = { src: string; alt: string };

export const GALLERY_PHOTOS: GalleryPhoto[] = [];

const PLACEHOLDER_COUNT = 8;
const AUTO_SCROLL_PX_PER_FRAME = 0.35;

function PlaceholderTile({ index }: { index: number }) {
  const s = swatch(index);
  return (
    <div
      className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2.5 rounded-[4px] border-2 border-ink"
      style={{ background: "#fff4e6", boxShadow: `inset 0 0 0 6px ${s.fill}` }}
    >
      <LogoMark className="h-12 w-12" />
      <span
        className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink">
        Photo coming soon
      </span>
    </div>
  );
}

export default function Gallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const dragRef = useRef<{ active: boolean; startX: number; startScroll: number }>({
    active: false,
    startX: 0,
    startScroll: 0,
  });
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);

  const usingPlaceholders = GALLERY_PHOTOS.length === 0;
  const items: (GalleryPhoto | null)[] = usingPlaceholders
    ? Array.from({ length: PLACEHOLDER_COUNT }, () => null)
    : GALLERY_PHOTOS;
  const run = [...items, ...items];

  // Auto-scroll with a seamless wrap at the halfway point.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const step = () => {
      if (!pausedRef.current && !dragRef.current.active) {
        el.scrollLeft += AUTO_SCROLL_PX_PER_FRAME;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
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
    dragRef.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !dragRef.current.active) return;
    el.scrollLeft = dragRef.current.startScroll - (e.clientX - dragRef.current.startX);
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current.active = false;
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
        className="no-scrollbar section-body flex cursor-grab gap-6 overflow-x-auto overscroll-x-contain px-5 py-5 active:cursor-grabbing sm:gap-8 sm:px-8"
        aria-label="Photos from past rides"
      >
        {run.map((photo, i) => {
          const tilt = i % 2 === 0 ? -2.5 : 2.5;
          const tile = (
            <div
              className="sticker w-[min(62vw,15rem)] shrink-0 rounded-[10px] border-[3px] border-ink bg-paper p-2.5 pb-8 shadow-[var(--card-shadow-sm)] transition-transform duration-200 hover:-translate-y-1"
              style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
            >
              {photo ? (
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  draggable={false}
                  className="aspect-[4/5] w-full rounded-[4px] border-2 border-ink object-cover"
                />
              ) : (
                <PlaceholderTile index={i} />
              )}
            </div>
          );

          return photo ? (
            <button
              key={`${photo.src}-${i}`}
              type="button"
              onClick={() => setLightbox(photo)}
              className="shrink-0"
              aria-label={`Open photo: ${photo.alt}`}
            >
              {tile}
            </button>
          ) : (
            <div key={`ph-${i}`} className="shrink-0" aria-hidden={i >= items.length}>
              {tile}
            </div>
          );
        })}
      </div>

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt}
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/85 p-5"
        >
          <div
            className="card max-h-[88vh] max-w-[min(92vw,44rem)] overflow-hidden p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-h-[74vh] w-full rounded-[8px] border-2 border-ink object-contain"
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
