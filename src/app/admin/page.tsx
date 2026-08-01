import type { Metadata } from "next";
import { adminConfigured, isSignedIn } from "@/lib/adminAuth";
import { readDraft, readStoredRide, storeConfigured } from "@/lib/rideStore";
import AdminConsole from "./AdminConsole";
import SignIn from "./SignIn";

/** Never cached, never indexed — it's a tool, not a page. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ride console",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="card mx-auto mt-24 max-w-md p-7">
        <h1 className="text-2xl">Ride console</h1>
        <p className="mt-3 text-ink-soft">
          Set <code>ADMIN_PASSWORD</code> in the Vercel project&rsquo;s environment variables
          and redeploy to switch this on.
        </p>
      </main>
    );
  }

  if (!(await isSignedIn())) {
    return (
      <main>
        <SignIn />
      </main>
    );
  }

  // A missing store shouldn't lock you out of the console — the console is
  // where you'd find out the store is missing.
  const [draft, current] = await Promise.all([
    readDraft().catch(() => null),
    readStoredRide().catch(() => null),
  ]);
  const pending = draft?.text?.trim() ? draft : null;

  return (
    <main>
      <AdminConsole
        initialPost={pending?.text ?? ""}
        draft={pending ? { receivedAt: pending.receivedAt, source: pending.source } : null}
        current={current}
        storeReady={storeConfigured()}
        apiKeyReady={Boolean(process.env.ANTHROPIC_API_KEY)}
      />
    </main>
  );
}
