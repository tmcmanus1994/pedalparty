import { NextResponse } from "next/server";
import { constantTimeEqual } from "@/lib/adminAuth";
import { storeConfigured, writeDraft } from "@/lib/rideStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The seam for email ingestion, which isn't built yet.
 *
 * Anything that can POST — an inbound-email service, a Zap, a shortcut on a
 * phone — drops the raw post here and /admin finds it already in the textarea
 * the next time it's opened. Nothing is published: a draft is a draft until a
 * human reads the preview and clicks a button.
 *
 * That's the whole reason this is a separate endpoint rather than part of
 * publishing. Adding email later means pointing a forwarding rule at this URL
 * and changing nothing else.
 *
 *   curl -X POST https://<site>/api/ingest \
 *        -H "content-type: application/json" \
 *        -d '{"secret":"<INGEST_SECRET>","text":"Hey friends!! ...","source":"email"}'
 *
 * With INGEST_SECRET unset the route refuses everything.
 */
export async function POST(request: Request) {
  const expected = process.env.INGEST_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  if (!storeConfigured()) {
    return NextResponse.json({ error: "no_store" }, { status: 503 });
  }

  let body: { secret?: string; text?: string; source?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }

  const supplied =
    body.secret ?? request.headers.get("x-ingest-secret") ?? "";
  if (!supplied || !constantTimeEqual(supplied, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  await writeDraft({
    text,
    receivedAt: new Date().toISOString(),
    source: body.source?.trim() || "webhook",
  });

  return NextResponse.json({ ok: true, drafted: true });
}
