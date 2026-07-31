import { tickerPhrases } from "@/lib/content";
import { swatch } from "@/lib/spectrum";

/**
 * Infinite marquee of value phrases. Each phrase takes the next spectrum
 * colour so the strip reads as a moving rainbow; the stars stay yellow.
 * Pauses on hover/focus; frozen under prefers-reduced-motion (globals.css).
 */
export default function Ticker() {
  const run = [...tickerPhrases, ...tickerPhrases];

  return (
    <div
      className="marquee relative overflow-hidden border-y-[3px] border-ink bg-paper py-3"
      aria-hidden="true"
    >
      <div className="marquee-track" style={{ "--marquee-duration": "44s" } as React.CSSProperties}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {run.map((phrase, i) => (
              <span key={`${copy}-${i}`} className="flex items-center whitespace-nowrap">
                <span
                  className="font-display text-[0.95rem] font-extrabold tracking-[0.1em] sm:text-lg"
                  style={{ color: swatch(i).text }}
                >
                  {phrase}
                </span>
                <span
                  className="px-3 text-lg text-yellow sm:px-5 sm:text-xl"
                  style={{ color: "#e1c718", WebkitTextStroke: "1px #222" }}
                >
                  ★
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
