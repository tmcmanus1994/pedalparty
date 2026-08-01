import { NextResponse } from "next/server";
import { z } from "zod";
import { constantTimeEqual } from "@/lib/adminAuth";
import { refreshSite } from "@/lib/refresh";
import { firstIssue, RidePayload } from "@/lib/ridePayload";
import { clearDraft, storeConfigured, writeDraft, writeStoredRide } from "@/lib/rideStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The way a ride gets into the site from outside it.
 *
 * Extraction — turning the volunteer's freeform post into these fields —
 * happens somewhere else entirely. This project neither knows nor cares how.
 * It accepts a finished ride and does one of two things with it:
 *
 *   draft: true   stage it for review. Nothing changes on the site. It shows
 *                 up in the console at /admin, where a human checks it and
 *                 clicks a button.
 *   draft: false  publish it. Live within seconds.
 *
 * The full JSON shape and a worked curl call are in the README.
 *
 * Gated by RIDE_SECRET. Unset, the route refuses everything — an open write
 * endpoint would let anyone put words on the homepage.
 */
const Body = z.object({
  secret: z.string().optional(),
  draft: z.boolean(),
  ride: RidePayload,
  /** Only meaningful on a draft: notes for the human reviewing it. */
  notes: z.string().trim().optional(),
  /** Free text for the audit trail — where this came from. */
  source: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const expected = process.env.RIDE_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "RIDE_SECRET is not set on the server." }, { status: 503 });
  }
  // Header first, so a caller that authenticates that way is never told
  // anything about the server's configuration by a validation error.
  const headerSecret = request.headers.get("x-ride-secret") ?? "";

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    if (headerSecret && !constantTimeEqual(headerSecret, expected)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: firstIssue(err) }, { status: 400 });
  }

  const supplied = headerSecret || body.secret || "";
  if (!supplied || !constantTimeEqual(supplied, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Checked after authenticating, so an unauthorized caller learns nothing
  // about how the server is set up.
  if (!storeConfigured()) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not set, so there's nowhere to write to." },
      { status: 503 },
    );
  }

  const source = body.source || "api";

  if (body.draft) {
    await writeDraft({
      ride: body.ride,
      notes: body.notes || undefined,
      receivedAt: new Date().toISOString(),
      source,
    });
    return NextResponse.json({ ok: true, draft: true });
  }

  await writeStoredRide({
    ride: body.ride,
    publishAt: null,
    updatedAt: new Date().toISOString(),
    source,
  });
  // This ride is on the site now; don't offer the old draft for review again.
  await clearDraft();
  refreshSite();

  return NextResponse.json({ ok: true, draft: false, published: true });
}
