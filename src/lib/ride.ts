/**
 * The Next Ride state machine (handoff §5).
 *
 * One `Status` value decides which single card renders. States A/C/D/E share
 * one card layout (heading + sub + optional note pill + countdown row);
 * State B is the richer ride-detail card.
 *
 * Data source: one JSON object in Vercel Blob, written by /admin. See
 * `rideStore.ts`. With the store unconfigured or empty the site renders the
 * fallback below, so local dev and previews work with no credentials.
 */

// Type-only, so this module stays free of the Blob client and can be imported
// by the admin console's preview in the browser.
import type { StoredRide } from "./rideStore";
import { nextSaturdayNoonCentral, nextSeasonOpener } from "./time";

export type RideStatus =
  | "Schedule" // State B — ride detail card
  | "Waiting" // State A — countdown to Saturday noon drop
  | "NoRide" // State C
  | "RainedOut" // State D
  | "Hibernating"; // State E

export type Ride = {
  status: RideStatus;
  /** ISO 8601 countdown target. States A/C/D: next Saturday noon Central. E: season opener. */
  countdownTarget: string;
  title?: string;
  sub?: string;
  location?: string;
  gatherTime?: string;
  rollTime?: string;
  /** 3 or 4 steps — the layout handles both. */
  plan?: string[];
  alert?: string;
  imageUrl?: string;
  /** CMS-driven text for the note pill on States C and D. */
  note?: string;
};

/** The ride fields a human owns. The countdown target is derived at read time. */
export type RideContent = Omit<Ride, "countdownTarget">;

export const STATUSES: RideStatus[] = [
  "Schedule",
  "Waiting",
  "NoRide",
  "RainedOut",
  "Hibernating",
];

/** Example ride from the handoff — used whenever the store is empty or unreachable. */
export const FALLBACK_RIDE: Omit<Ride, "countdownTarget"> = {
  status: "Schedule",
  title: "Taco 'Bout Halfway",
  sub: "Halfway through the season, y'all! Easy-rolling route with a couple shorter hills.",
  location: "Camp Taco",
  gatherTime: "Gather 6:00 PM",
  rollTime: "Roll 6:30 PM",
  plan: [
    "Gather 6 PM at Camp Taco — arrive early for food & bring a lock",
    "6:30 PM roll out to Moody Brews — bonus beverage line like last time!",
    "Moody Brews opens just for us — no outside booze in the square or lot",
    "Wrap up the night at Lost Forty",
  ],
  alert: "BRING LIGHTS! Helmets strongly encouraged!",
  imageUrl: "/images/flyer-taco-bout-halfway.jpg",
};

/** Fill in the countdown target a status implies, if none was supplied. */
export function withCountdown(
  ride: Omit<Ride, "countdownTarget"> & { countdownTarget?: string },
): Ride {
  const target =
    ride.countdownTarget ||
    (ride.status === "Hibernating" ? nextSeasonOpener() : nextSaturdayNoonCentral());
  return { ...ride, countdownTarget: target };
}

export function normalizeStatus(value: string): RideStatus {
  const cleaned = value.replace(/[\s_-]/g, "").toLowerCase();
  const match = STATUSES.find((s) => s.toLowerCase() === cleaned);
  return match ?? "Waiting";
}

/**
 * Turn what's in the store into the ride to render *right now*.
 *
 * A held ride resolves to the Waiting card counting down to its release, and
 * flips on its own the moment that instant passes — which is why holding
 * until Saturday noon needs no scheduled job. The site re-renders at least
 * every five minutes, so the flip lands within five minutes of noon.
 *
 * Pure and exported so it can be tested without touching the network.
 */
export function resolveStoredRide(stored: StoredRide, now: number = Date.now()): Ride {
  const holdUntil = stored.publishAt ? Date.parse(stored.publishAt) : NaN;
  if (Number.isFinite(holdUntil) && now < holdUntil) {
    return { status: "Waiting", countdownTarget: new Date(holdUntil).toISOString() };
  }
  return withCountdown(stored.ride);
}
