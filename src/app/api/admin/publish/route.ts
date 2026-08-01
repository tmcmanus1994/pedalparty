import { NextResponse } from "next/server";
import { z } from "zod";
import { isSignedIn } from "@/lib/adminAuth";
import { refreshSite } from "@/lib/refresh";
import { firstIssue, RidePayload } from "@/lib/ridePayload";
import { clearDraft, storeConfigured, writeStoredRide } from "@/lib/rideStore";
import { nextSaturdayNoonCentral } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What the console's two buttons call. Cookie-gated, so the browser never
 * needs to hold RIDE_SECRET.
 *
 * Same validation and the same store writes as `/api/ride` — the difference
 * is only who's allowed to call it, and that this one can hold a ride back
 * until Saturday noon.
 */
const Body = z.object({
  ride: RidePayload,
  /** true = hold until Saturday noon Central; false = live now. */
  hold: z.boolean(),
});

export async function POST(request: Request) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!storeConfigured()) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not set, so there's nowhere to publish to." },
      { status: 503 },
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: firstIssue(err) }, { status: 400 });
  }

  const publishAt = body.hold ? nextSaturdayNoonCentral() : null;

  await writeStoredRide({
    ride: body.ride,
    publishAt,
    updatedAt: new Date().toISOString(),
    source: "admin",
  });

  // The draft has become the ride; don't offer it for review again.
  await clearDraft();

  refreshSite();

  return NextResponse.json({ ok: true, publishAt });
}
