import type { Metadata } from "next";
import RideStatesPreview from "@/components/RideStates";
import { BRAND } from "@/lib/spectrum";

/**
 * The same all-states view the homepage shows while PREVIEW_ALL_STATES is on,
 * but on its own page — so it stays available after the homepage flag goes back
 * to `false`. Not linked from anywhere, and noindex.
 */
export const metadata: Metadata = {
  title: "Next Ride states — preview",
  robots: { index: false, follow: false },
};

/** Countdowns are computed at request time, so keep this fresh. */
export const revalidate = 300;

export default function NextRideStatesPreview() {
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

      <div className="shell pb-20">
        <RideStatesPreview />
      </div>
    </main>
  );
}
