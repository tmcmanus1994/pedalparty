"use client";

import { useEffect, useState } from "react";
import { BRAND, onBrand } from "@/lib/spectrum";

/** Client-specified, one colour per unit — not the generic spectrum cycle. */
const UNITS = [
  { key: "days", label: "DAYS", fill: BRAND.purple },
  { key: "hours", label: "HOURS", fill: BRAND.magenta },
  { key: "mins", label: "MINS", fill: BRAND.orange },
  { key: "secs", label: "SECS", fill: BRAND.teal },
] as const;

function remaining(target: number, now: number) {
  const diff = Math.max(0, target - now);
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
  };
}

/**
 * Four chunky spectrum blocks, always on one row — type scales, it never wraps.
 * Digits get a short slide-in tick when they change.
 */
export default function Countdown({
  target,
  label,
}: {
  target: string;
  label: string;
}) {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = now === null ? null : remaining(targetMs, now);

  return (
    <div
      className="mx-auto grid w-full max-w-md grid-cols-4 gap-2 sm:gap-3"
      role="timer"
      aria-label={label}
    >
      {UNITS.map((unit) => {
        const value = time ? time[unit.key] : null;
        const display = value === null ? "––" : String(value).padStart(2, "0");
        return (
          <div
            key={unit.key}
            className="flex flex-col items-center justify-center rounded-[14px] border-[3px] border-ink px-1 py-2.5 shadow-[4px_4px_0_var(--color-ink)] sm:rounded-[16px] sm:py-3"
            style={{ background: unit.fill, color: onBrand(unit.fill) }}
          >
            <span className="overflow-hidden text-[clamp(1.5rem,7.5vw,2.5rem)] font-extrabold leading-none tabular-nums">
              {/* Seconds change every tick; animating them means the digit is
                  mid-slide a third of the time, which reads as jitter. Days,
                  hours and minutes change rarely enough to be worth the flip. */}
              <span key={display} className={unit.key === "secs" ? "block" : "tick block"}>
                {display}
              </span>
            </span>
            <span className="mt-1.5 text-[clamp(0.56rem,2.3vw,0.72rem)] font-bold uppercase leading-none tracking-[0.12em]">
              {unit.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
