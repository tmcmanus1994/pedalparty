import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminConfigured, constantTimeEqual, tokenFor } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sign in. Body: `{ "password": "..." }`. */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!adminConfigured() || !expected) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let supplied = "";
  try {
    const body = (await request.json()) as { password?: string };
    supplied = body.password ?? "";
  } catch {
    // falls through to the 401
  }

  if (!supplied || !constantTimeEqual(supplied, expected)) {
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await tokenFor(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
