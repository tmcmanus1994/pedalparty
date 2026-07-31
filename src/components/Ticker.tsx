import { tickerPhrases } from "@/lib/content";
import { BRAND, BRAND_ON_LIGHT } from "@/lib/spectrum";

/**
 * Ticker text cycles the brand colours that hold up as type on the white
 * strip. Orange, green and yellow are fill colours — as words on white they
 * drop to 2.6:1 or worse, so they carry the strip as the star fill instead.
 */
const TICKER_COLORS = Object.values(BRAND_ON_LIGHT);

/**
 * Infinite marquee of value phrases. Each phrase takes the next spectrum
 * colour so the strip reads as a moving rainbow.
 *
 * The separator is a drawn star rather than the ★ character — Baloo 2 has no
 * U+2605, so a text star would silently fall back to a system face and break
 * the line's rhythm.
 *
 * Pauses on hover/focus; frozen under prefers-reduced-motion (globals.css).
 */
function Star() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mx-5 h-[1.05em] w-[1.05em] shrink-0 sm:mx-7"
      aria-hidden="true"
    >
      <path
        d="M12 1.6l3.1 6.6 7 .95-5.1 4.9 1.3 7.15L12 17.8l-6.3 3.4 1.3-7.15-5.1-4.9 7-.95z"
        fill={BRAND.yellow}
        stroke="#222"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Ticker() {
  const run = [...tickerPhrases, ...tickerPhrases];

  return (
    <div
      className="marquee relative overflow-hidden border-y-[3px] border-ink bg-paper py-4 sm:py-5"
      aria-hidden="true"
    >
      <div className="marquee-track" style={{ "--marquee-duration": "52s" } as React.CSSProperties}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {run.map((phrase, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span
                  className="whitespace-nowrap text-[1.3rem] font-extrabold leading-none tracking-[0.02em] sm:text-[1.75rem]"
                  style={{ color: TICKER_COLORS[i % TICKER_COLORS.length] }}
                >
                  {phrase}
                </span>
                <Star />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
