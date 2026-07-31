/**
 * Small timezone helpers. Pedal Party runs on Central time (America/Chicago),
 * so every "Saturday at noon" / "6:00 PM Monday" is a Central wall-clock time
 * regardless of where the visitor is.
 *
 * No date library — Intl gets us there for the two things we need.
 */

export const RIDE_TZ = "America/Chicago";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: RIDE_TZ,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** The zone's UTC offset, in ms, at a given instant. */
function offsetAt(instant: number): number {
  const p = partsFormatter.formatToParts(new Date(instant));
  const get = (type: string) => Number(p.find((x) => x.type === type)?.value ?? 0);
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUTC - instant;
}

/**
 * Convert a Central wall-clock time to a UTC epoch (ms).
 * Two passes settle the DST boundary case.
 */
export function centralToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour = 0,
  minute = 0,
): number {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  let guess = naive - offsetAt(naive);
  guess = naive - offsetAt(guess);
  return guess;
}

/** Calendar parts of an instant, as seen in Central time. */
export function centralParts(instant: number) {
  const p = partsFormatter.formatToParts(new Date(instant));
  const get = (type: string) => Number(p.find((x) => x.type === type)?.value ?? 0);
  const weekday = new Date(instant).toLocaleDateString("en-US", {
    timeZone: RIDE_TZ,
    weekday: "short",
  });
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    weekday: weekdayIndex,
  };
}

/**
 * The next Saturday 12:00 PM Central strictly after `from`.
 * This is when the weekly plan drops (handoff §4, §5).
 */
export function nextSaturdayNoonCentral(from: number = Date.now()): string {
  const p = centralParts(from);
  let daysAhead = (6 - p.weekday + 7) % 7; // 6 = Saturday
  // Once it's noon on Saturday the drop has happened — aim at the next one,
  // otherwise the countdown would sit on zero for the rest of the hour.
  if (daysAhead === 0 && p.hour >= 12) daysAhead = 7;
  const target = centralToUtc(p.year, p.month, p.day + daysAhead, 12, 0);
  return new Date(target).toISOString();
}

/**
 * The next season opener: April Fools' Day, 6:00 PM Central
 * ("We ride again on April Fools' Day — no joke.").
 */
export function nextSeasonOpener(from: number = Date.now()): string {
  const p = centralParts(from);
  const thisYear = centralToUtc(p.year, 4, 1, 18, 0);
  const target = thisYear > from ? thisYear : centralToUtc(p.year + 1, 4, 1, 18, 0);
  return new Date(target).toISOString();
}
