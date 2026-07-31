/**
 * The Next Ride state machine (handoff §5).
 *
 * One `Status` value decides which single card renders. States A/C/D/E share
 * one card layout (heading + sub + optional note pill + countdown row);
 * State B is the richer ride-detail card.
 *
 * Data source: the existing Google Sheet the Cowork automation already writes
 * to. Nothing about that pipeline changes — the site reads the sheet, it does
 * not own it. Publish the sheet to the web as CSV and set RIDE_SHEET_CSV_URL;
 * with the variable unset the site renders the fallback below, so local dev
 * and previews work with no credentials.
 *
 * Sheet columns (handoff §8.3):
 *   Ride Date | Theme/Title | Sub Text | Starting Location | Gathering Time |
 *   Start Rolling | Plan 1 | Plan 2 | Plan 3 | Plan 4 | Alert | Status |
 *   Next Ride | Image URL
 */

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

const STATUSES: RideStatus[] = [
  "Schedule",
  "Waiting",
  "NoRide",
  "RainedOut",
  "Hibernating",
];

/** Example ride from the handoff — used whenever the sheet is unreachable. */
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

/** Fill in the countdown target a status implies, if the sheet didn't supply one. */
function withCountdown(ride: Omit<Ride, "countdownTarget"> & { countdownTarget?: string }): Ride {
  const target =
    ride.countdownTarget ||
    (ride.status === "Hibernating" ? nextSeasonOpener() : nextSaturdayNoonCentral());
  return { ...ride, countdownTarget: target };
}

/** Minimal RFC 4180 CSV parser — handles quoted fields, commas and newlines inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function normalizeStatus(value: string): RideStatus {
  const cleaned = value.replace(/[\s_-]/g, "").toLowerCase();
  const match = STATUSES.find((s) => s.toLowerCase() === cleaned);
  return match ?? "Waiting";
}

function rowToRide(header: string[], row: string[]): Ride {
  const key = (name: string) => {
    const idx = header.findIndex(
      (h) => h.trim().toLowerCase() === name.toLowerCase(),
    );
    return idx === -1 ? "" : (row[idx] ?? "").trim();
  };

  const plan = [key("Plan 1"), key("Plan 2"), key("Plan 3"), key("Plan 4")].filter(Boolean);

  return withCountdown({
    status: normalizeStatus(key("Status")),
    title: key("Theme/Title") || key("Theme") || undefined,
    sub: key("Sub Text") || undefined,
    location: key("Starting Location") || undefined,
    gatherTime: key("Gathering Time") || undefined,
    rollTime: key("Start Rolling") || undefined,
    plan: plan.length ? plan : undefined,
    alert: key("Alert") || undefined,
    note: key("Note") || key("Alert") || undefined,
    imageUrl: key("Image URL") || undefined,
    countdownTarget: key("Next Ride") || undefined,
  });
}

/**
 * Read the current ride. Revalidates every 5 minutes so a sheet edit reaches
 * the site quickly without a redeploy.
 */
export async function getRide(): Promise<Ride> {
  const url = process.env.RIDE_SHEET_CSV_URL;
  if (!url) return withCountdown(FALLBACK_RIDE);

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Sheet responded ${res.status}`);
    const rows = parseCsv(await res.text());
    if (rows.length < 2) throw new Error("Sheet has no data rows");
    // Last non-empty row wins — the automation appends the current week.
    return rowToRide(rows[0], rows[rows.length - 1]);
  } catch (err) {
    console.error("[pedalparty] ride sheet fetch failed, using fallback:", err);
    return withCountdown(FALLBACK_RIDE);
  }
}
