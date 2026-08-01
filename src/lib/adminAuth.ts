import { cookies } from "next/headers";

/**
 * Password gate for /admin.
 *
 * One shared password in `ADMIN_PASSWORD`. Signing in stores an HMAC of it in
 * an httpOnly cookie, so the password itself never sits in the browser and
 * changing it signs everyone out. Web Crypto only, so this runs unchanged in
 * middleware (edge) and in route handlers (node).
 *
 * This is a gate on a page that edits one JSON file for a bike club, not an
 * identity system: no accounts, no rotation, no sessions to revoke
 * individually. If that ever stops being true, this is the file to replace.
 */

export const ADMIN_COOKIE = "pp_admin";

/** Domain separation, so the token can't be reused as any other signature. */
const TOKEN_PAYLOAD = "pedalparty-admin-v1";

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export async function tokenFor(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(TOKEN_PAYLOAD));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Does this cookie value sign in against the current password? */
export async function tokenIsValid(token: string | undefined): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !token) return false;
  return constantTimeEqual(token, await tokenFor(password));
}

/** For server components and route handlers. */
export async function isSignedIn(): Promise<boolean> {
  const jar = await cookies();
  return tokenIsValid(jar.get(ADMIN_COOKIE)?.value);
}
