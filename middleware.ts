import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, tokenIsValid } from "@/lib/adminAuth";

/**
 * Blanket gate on the admin API.
 *
 * Every /api/admin route also checks for itself — this is the belt, those are
 * the braces. It matters because forgetting the check in one new route would
 * otherwise expose it, and the routes here write the site's only content.
 *
 * /admin itself is deliberately not gated: that page renders the sign-in form
 * when you aren't signed in, and it has to be reachable to do that.
 */
export const config = { matcher: ["/api/admin/:path*"] };

export async function middleware(request: NextRequest) {
  // The login route is the way in — it can't require being in already.
  if (request.nextUrl.pathname === "/api/admin/login") return NextResponse.next();

  if (await tokenIsValid(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.next();
  }
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
