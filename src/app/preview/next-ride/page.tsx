import type { Metadata } from "next";
import { RideCard } from "@/components/NextRide";
import { FALLBACK_RIDE, type Ride, type RideStatus } from "@/lib/ride";
import { nextSaturdayNoonCentral, nextSeasonOpener } from "@/lib/time";
import { BRAND, onBrand } from "@/lib/spectrum";

/**
 * Internal preview: every Next Ride state on one page, labelled.
 *
 * Not linked from anywhere and marked noindex — it exists so the card can be
 * reviewed in all five states without editing the sheet. The homepage still
 * renders exactly one state, chosen by the `Status` column.
 */
export const metadata: Metadata = {
  title: "Next Ride states — preview",
  robots: { index: false, follow: false },
};

/** Countdowns are computed at request time, so keep this fresh. */
export const revalidate = 300;

type Variant = {
  /** The value that goes in the sheet's `Status` column. */
  status: RideStatus;
  /** The letter this state is called in the design handoff (§5). */
  letter: string;
  what: string;
  when: string;
};

const VARIANTS: Variant[] = [
  {
    status: "Schedule",
    letter: "B",
    what: "A ride is planned. The full detail card — flyer, chips, Da Plan, heads-up.",
    when: "Saturday noon through the Monday ride.",
  },
  {
    status: "Waiting",
    letter: "A",
    what: "Between rides. Countdown to when the next plan drops.",
    when: "Tuesday through Saturday noon, the normal resting state.",
  },
  {
    status: "NoRide",
    letter: "C",
    what: "A scheduled week off. Note pill explains why.",
    when: "Holidays, conflicts — anything planned in advance.",
  },
  {
    status: "RainedOut",
    letter: "D",
    what: "This week's ride is cancelled. Note pill carries the reason.",
    when: "Same-day call, weather.",
  },
  {
    status: "Hibernating",
    letter: "E",
    what: "Off-season. Countdown targets the season opener, not Saturday.",
    when: "Halloween through April Fools' Day.",
  },
];

export default function NextRideStatesPreview() {
  const saturday = nextSaturdayNoonCentral();
  const opener = nextSeasonOpener();

  const rides: Ride[] = VARIANTS.map((v) =>
    v.status === "Schedule"
      ? { ...FALLBACK_RIDE, status: "Schedule", countdownTarget: saturday }
      : {
          status: v.status,
          countdownTarget: v.status === "Hibernating" ? opener : saturday,
        },
  );

  return (
    <main className="bg-cream">
      <div className="shell py-14">
        <p className="eyebrow" style={{ color: BRAND.magenta }}>
          Internal preview · not linked, not indexed
        </p>
        <h1 className="section-title mt-2">Next Ride — all five states</h1>
        <p className="sub-section !mx-0 !text-left">
          Every state below is live: the countdowns are running. States A, B, C and D
          target <strong>this Saturday at noon Central</strong>; state E targets{" "}
          <strong>April Fools&rsquo; Day</strong>, the season opener. Set the{" "}
          <code className="rounded bg-cream-deep px-1.5 py-0.5 font-bold">Status</code>{" "}
          column in the ride sheet to the value shown on each card to pick one.
        </p>
      </div>

      {VARIANTS.map((v, i) => {
        const fill = [BRAND.magenta, BRAND.red, BRAND.orange, BRAND.green, BRAND.teal][i];
        return (
          <section key={v.status} className="border-t-[3px] border-ink py-12">
            <div className="shell">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="rounded-full border-[3px] border-ink px-4 py-1.5 font-mono text-[1.05rem] font-extrabold shadow-[var(--card-shadow-xs)]"
                  style={{ background: fill, color: onBrand(fill) }}
                >
                  {v.status}
                </span>
                <span className="pill !py-1">Handoff state {v.letter}</span>
              </div>
              <p className="mt-3 max-w-[70ch] font-bold">{v.what}</p>
              <p className="mt-1 max-w-[70ch] text-body-sm text-ink-soft">
                Shows: {v.when}
              </p>

              <div className="mt-7">
                <RideCard ride={rides[i]} />
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}
