import "server-only";
import { FALLBACK_RIDE, resolveStoredRide, withCountdown, type Ride } from "./ride";
import { readStoredRide } from "./rideStore";

/**
 * Read the current ride, server-side.
 *
 * Kept apart from `ride.ts` so that file stays free of the Blob client: the
 * admin console renders the real card in the browser to preview a draft, and
 * it imports the types and `withCountdown` from there.
 *
 * The page revalidates every 5 minutes on its own, and publishing from /admin
 * calls `refreshSite()`, so a new ride is live in seconds.
 */
export async function getRide(): Promise<Ride> {
  try {
    const stored = await readStoredRide();
    if (!stored) return withCountdown(FALLBACK_RIDE);
    return resolveStoredRide(stored);
  } catch (err) {
    console.error("[pedalparty] ride store read failed, using fallback:", err);
    return withCountdown(FALLBACK_RIDE);
  }
}
