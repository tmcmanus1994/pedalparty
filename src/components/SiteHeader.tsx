"use client";

import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/lib/content";
import { swatch } from "@/lib/spectrum";

/**
 * Header: email left, "Menu+" right. The trigger cascades a stack of anchor
 * pills beneath it (handoff §3), each staggered ~40ms with a spring pop.
 * Active section highlights; any anchor click closes the menu.
 */
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape and on outside click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active-section highlighting.
  useEffect(() => {
    const sections = nav
      .map(({ href }) => document.querySelector<HTMLElement>(href))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(`#${hit.target.id}`);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.01, 0.25, 0.5] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        scrolled ? "bg-cream/92 backdrop-blur-sm border-b-[3px] border-ink" : ""
      }`}
      style={{ minHeight: "var(--header-h)" }}
    >
      <div className="shell flex h-[var(--header-h)] items-center justify-between gap-3">
        <a
          href={`mailto:${site.email}`}
          className={`text-[0.88rem] font-bold tracking-wide underline decoration-2 underline-offset-4 sm:text-[0.95rem] ${
            scrolled ? "text-purple" : "text-white drop-shadow-[0_1px_3px_rgba(34,34,34,0.85)]"
          }`}
        >
          {site.email}
        </a>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-panel"
            className={`pill !px-4 !py-1.5 uppercase tracking-wider transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
              open ? "bg-purple text-white" : ""
            }`}
          >
            Menu
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200"
              style={{ transform: open ? "rotate(135deg)" : "none" }}
            >
              +
            </span>
          </button>

          <div
            id="menu-panel"
            className={`absolute right-0 top-[calc(100%+10px)] flex w-[min(78vw,15rem)] flex-col items-end gap-2 ${
              open ? "" : "pointer-events-none"
            }`}
          >
            {nav.map((item, i) => {
              const s = swatch(i);
              const isActive = active === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  tabIndex={open ? 0 : -1}
                  aria-current={isActive ? "true" : undefined}
                  className="pill w-full justify-center !py-2.5 transition-[transform,opacity] duration-300"
                  style={{
                    background: isActive ? s.fill : "#fff",
                    color: isActive ? s.on : "#222",
                    transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transitionDelay: `${(open ? i : nav.length - 1 - i) * 40}ms`,
                    opacity: open ? 1 : 0,
                    transform: open
                      ? "translateY(0) scale(1)"
                      : "translateY(-10px) scale(0.9)",
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
