import { del, head, put } from "@vercel/blob";
import type { RideContent } from "./ride";

/**
 * Where the current ride lives.
 *
 * One JSON object in Vercel Blob, overwritten in place. Blob rather than KV
 * for three reasons: it needs exactly one env var (`BLOB_READ_WRITE_TOKEN`,
 * injected automatically when you create the store in the Vercel dashboard)
 * with no third-party marketplace account to sign up for; the stored object
 * is a plain readable JSON file you can open, download and hand-edit, which
 * keeps the one virtue the Google Sheet actually had — a wrong time is one
 * edit away from fixed; and it's free at this volume, which is one write a
 * week.
 *
 * A KV store would give marginally faster reads. The site reads this at most
 * once every five minutes, so that isn't worth an extra account.
 */

export const RIDE_BLOB = "ride/current.json";
export const DRAFT_BLOB = "ride/draft.json";

export type StoredRide = {
  ride: RideContent;
  /**
   * ISO instant. Until it passes the site shows the Waiting card counting down
   * to it; after, the ride goes live. `null` means live immediately.
   *
   * Resolving the hold at *read* time is what removes the need for a cron: no
   * job has to wake up at Saturday noon and flip a status.
   */
  publishAt: string | null;
  updatedAt: string;
  /** Audit trail — who or what wrote this. */
  source: string;
};

/**
 * A ride waiting for a human to look at it. Written by `/api/ride` with
 * `draft: true` — typically by whatever does the extraction outside this
 * project. A draft is never rendered on the site; it only ever shows up in
 * the console at /admin.
 */
export type StoredDraft = {
  ride: RideContent;
  /**
   * Optional free text for whoever reviews it — judgment calls, anything the
   * extractor was unsure about. Shown in the console, never on the site.
   */
  notes?: string;
  receivedAt: string;
  source: string;
};

export function storeConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readJson<T>(pathname: string): Promise<T | null> {
  if (!storeConfigured()) return null;

  let url: string;
  try {
    url = (await head(pathname)).url;
  } catch {
    // Nothing written yet, or the store is unreachable. Either way: no ride.
    return null;
  }

  // Blob's CDN holds content for at least 60 seconds (`cacheControlMaxAge`
  // won't go below a minute), so a just-published ride can read back stale.
  // The timestamp busts it. This fetch only runs when the page regenerates,
  // so it costs one request per five minutes, not one per visitor.
  const res = await fetch(`${url}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Blob ${pathname} responded ${res.status}`);
  return (await res.json()) as T;
}

async function writeJson(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export function readStoredRide(): Promise<StoredRide | null> {
  return readJson<StoredRide>(RIDE_BLOB);
}

export function writeStoredRide(stored: StoredRide): Promise<void> {
  return writeJson(RIDE_BLOB, stored);
}

export function readDraft(): Promise<StoredDraft | null> {
  return readJson<StoredDraft>(DRAFT_BLOB);
}

export function writeDraft(draft: StoredDraft): Promise<void> {
  return writeJson(DRAFT_BLOB, draft);
}

/** Drop a draft — published, or discarded from the console. */
export async function clearDraft(): Promise<void> {
  if (!storeConfigured()) return;
  try {
    await del(DRAFT_BLOB);
  } catch {
    // Already gone is the outcome we wanted.
  }
}
