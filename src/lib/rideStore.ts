import { head, put } from "@vercel/blob";
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

/** A pasted post waiting to be turned into a card. Written by the admin or a webhook. */
export type StoredDraft = {
  text: string;
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

/**
 * Clear a consumed draft. Blob has no delete-if-exists that's cheaper than
 * overwriting, and an empty draft reads the same as none.
 */
export function clearDraft(): Promise<void> {
  return writeJson(DRAFT_BLOB, { text: "", receivedAt: new Date().toISOString(), source: "cleared" });
}
