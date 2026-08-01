import { NextResponse } from "next/server";
import { isSignedIn } from "@/lib/adminAuth";
import { extractRide } from "@/lib/extractRide";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A long post at medium effort takes a while; don't let the platform cut it off. */
export const maxDuration = 120;

/** Read a pasted post into card fields. Body: `{ "post": "..." }`. */
export async function POST(request: Request) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let post = "";
  try {
    const body = (await request.json()) as { post?: string };
    post = body.post ?? "";
  } catch {
    return NextResponse.json({ error: "Send JSON with a `post` field." }, { status: 400 });
  }

  const result = await extractRide(post);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

  return NextResponse.json({ extraction: result.extraction });
}
