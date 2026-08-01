import { NextResponse } from "next/server";
import { refreshSite } from "@/lib/refresh";

/**
 * Push the site to re-read the ride store right now.
 *
 * Without this the homepage picks up a new ride within 5 minutes on its own
 * (`revalidate = 300`). Publishing from /admin refreshes directly through
 * `refreshSite()`; this endpoint is the same action for anything outside the
 * app — a webhook, a script, a hand-run curl after editing the stored JSON.
 *
 *   curl -X POST https://<site>/api/revalidate \
 *        -H "content-type: application/json" \
 *        -d '{"secret":"<REVALIDATE_SECRET>"}'
 *
 * The secret may also be sent as `?secret=` or an `x-revalidate-secret` header.
 * With REVALIDATE_SECRET unset the route refuses everything — an open
 * revalidate endpoint is a free way for anyone to hammer the origin.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    console.warn("[pedalparty] /api/revalidate called but REVALIDATE_SECRET is unset");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  let supplied = url.searchParams.get("secret") ?? request.headers.get("x-revalidate-secret") ?? "";

  if (!supplied && request.headers.get("content-type")?.includes("application/json")) {
    try {
      const body = (await request.json()) as { secret?: string };
      supplied = body.secret ?? "";
    } catch {
      // fall through to the 401 below
    }
  }

  if (!supplied || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  refreshSite();

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
