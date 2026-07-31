"use client";

import { useEffect, useState } from "react";
import { swatch } from "@/lib/spectrum";

const UNITS = [
  { key: "days", label: "DAYS" },
  { key: "hours", label: "HOURS" },
  { key: "mins", label: "MINS" },
  { key: "secs", label: "SECS" },
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
      {UNITS.map((unit, i) => {
        const s = swatch(i);
        const value = time ? time[unit.key] : null;
        const display = value === null ? "––" : String(value).padStart(2, "0");
        return (
          <div
            key={unit.key}
            className="flex flex-col items-center justify-center rounded-[14px] border-[3px] border-ink px-1 py-2.5 shadow-[4px_4px_0_var(--color-ink)] sm:rounded-[16px] sm:py-3"
            style={{ background: s.fill, color: s.on }}
          >
            <span className="overflow-hidden font-display text-[clamp(1.35rem,7vw,2.25rem)] font-extrabold leading-none tabular-nums">
              <span key={display} className="tick block">
                {display}
              </span>
            </span>
            <span className="mt-1 font-display text-[clamp(0.5rem,2.2vw,0.68rem)] font-bold uppercase leading-none tracking-[0.12em]">
              {unit.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
