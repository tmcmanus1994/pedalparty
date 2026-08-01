import { RideCard } from "./NextRide";
import { FALLBACK_RIDE, type Ride, type RideStatus } from "@/lib/ride";
import { nextSaturdayNoonCentral, nextSeasonOpener } from "@/lib/time";
import { BRAND, onBrand } from "@/lib/spectrum";

/**
 * Every Next Ride state, stacked and labelled — a review aid, not a shipping
 * layout. Rendered inside the Next Ride section while PREVIEW_ALL_STATES is on
 * in NextRide.tsx, and also on its own at /preview/next-ride.
 *
 * Countdowns are live: A/B/C/D target the next Saturday at noon Central,
 * E targets the season opener.
 */

type Variant = {
  /** The value that goes in the sheet's `Status` column. */
  status: RideStatus;
  /** The letter this state is called in the design handoff (§5). */
  letter: string;
  what: string;
  when: string;
  chip: string;
};

export const RIDE_STATE_VARIANTS: Variant[] = [
  {
    status: "Schedule",
    letter: "B",
    what: "A ride is planned. The full detail card — flyer, chips, Da Plan, heads-up.",
    when: "Saturday noon through the Monday ride.",
    chip: BRAND.magenta,
  },
  {
    status: "Waiting",
    letter: "A",
    what: "Between rides. Countdown to when the next plan drops.",
    when: "Tuesday through Saturday noon — the normal resting state.",
    chip: BRAND.red,
  },
  {
    status: "NoRide",
    letter: "C",
    what: "A scheduled week off. The note pill explains why.",
    when: "Holidays, conflicts — anything planned in advance.",
    chip: BRAND.orange,
  },
  {
    status: "RainedOut",
    letter: "D",
    what: "This week's ride is cancelled. The note pill carries the reason.",
    when: "Same-day call, weather.",
    chip: BRAND.green,
  },
  {
    status: "Hibernating",
    letter: "E",
    what: "Off-season. The countdown targets the season opener, not Saturday.",
    when: "Halloween through April Fools' Day.",
    chip: BRAND.teal,
  },
];

function ridesForPreview(): Ride[] {
  const saturday = nextSaturdayNoonCentral();
  const opener = nextSeasonOpener();
  return RIDE_STATE_VARIANTS.map((v) =>
    v.status === "Schedule"
      ? { ...FALLBACK_RIDE, status: "Schedule" as const, countdownTarget: saturday }
      : {
          status: v.status,
          countdownTarget: v.status === "Hibernating" ? opener : saturday,
        },
  );
}

export default function RideStatesPreview() {
  const rides = ridesForPreview();

  return (
    <div className="space-y-10">
      {RIDE_STATE_VARIANTS.map((v, i) => (
        <div key={v.status} className="border-t-[3px] border-dashed border-ink/40 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span
              className="rounded-full border-[3px] border-ink px-4 py-1.5 font-mono text-[1.05rem] font-extrabold shadow-[var(--card-shadow-xs)]"
              style={{ background: v.chip, color: onBrand(v.chip) }}
            >
              {v.status}
            </span>
            <span className="pill !py-1">Handoff state {v.letter}</span>
          </div>
          <p className="mx-auto mt-3 max-w-[64ch] text-center font-bold">{v.what}</p>
          <p className="mx-auto mt-1 max-w-[64ch] text-center text-body-sm text-ink-soft">
            Shows: {v.when}
          </p>

          <div className="mt-7">
            <RideCard ride={rides[i]} />
          </div>
        </div>
      ))}
    </div>
  );
}
