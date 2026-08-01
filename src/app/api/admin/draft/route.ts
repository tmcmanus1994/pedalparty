import { NextResponse } from "next/server";
import { isSignedIn } from "@/lib/adminAuth";
import { clearDraft } from "@/lib/rideStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Throw away a staged draft without publishing it. */
export async function DELETE() {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await clearDraft();
  return NextResponse.json({ ok: true });
}
