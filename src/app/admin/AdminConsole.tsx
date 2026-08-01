"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RideCard } from "@/components/NextRide";
import { STATUSES, withCountdown, type RideContent, type RideStatus } from "@/lib/ride";
import type { StoredRide } from "@/lib/rideStore";

/**
 * The weekly job, in one page: paste the post, read the card it produced,
 * fix anything that's off, publish.
 *
 * The preview is the real `RideCard` the homepage renders — not a mockup of
 * it — so what you approve is exactly what ships.
 */

const EMPTY: RideContent = { status: "Schedule" };

/** Plan lines longer than this get cramped on a phone. Advisory, not enforced. */
const PLAN_LINE_LIMIT = 75;

type Props = {
  initialPost: string;
  draft: { receivedAt: string; source: string } | null;
  current: StoredRide | null;
  storeReady: boolean;
  apiKeyReady: boolean;
};

function Field({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      {hint ? <span className="ml-2 text-xs text-ink-soft">{hint}</span> : null}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="field mt-1.5 w-full"
      />
    </label>
  );
}

export default function AdminConsole({
  initialPost,
  draft,
  current,
  storeReady,
  apiKeyReady,
}: Props) {
  const [post, setPost] = useState(initialPost);
  const [ride, setRide] = useState<RideContent | null>(current?.ride ?? null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"read" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  // The preview's countdown is computed from the clock, so render it only
  // after mount — otherwise the server and client disagree on the target.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const preview = useMemo(() => (ride ? withCountdown(ride) : null), [ride]);

  function patch(key: keyof RideContent, value: string) {
    setRide((r) => ({ ...(r ?? EMPTY), [key]: value }));
    setDone("");
  }

  function patchPlan(index: number, value: string) {
    setRide((r) => {
      const base = r ?? EMPTY;
      const plan = [...(base.plan ?? [])];
      plan[index] = value;
      return { ...base, plan };
    });
    setDone("");
  }

  async function readPost() {
    setBusy("read");
    setError("");
    setDone("");
    try {
      const res = await fetch("/api/admin/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        extraction?: RideContent & { notes?: string };
        error?: string;
      };
      if (!res.ok || !body.extraction) {
        setError(body.error ?? "Couldn't read that post.");
        return;
      }
      const { notes: modelNotes, ...fields } = body.extraction;
      setRide({ ...fields, status: "Schedule" });
      setNotes(modelNotes ?? "");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  async function publish(hold: boolean) {
    if (!ride) return;
    setBusy("publish");
    setError("");
    setDone("");
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ride, hold }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        publishAt?: string | null;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Publishing failed.");
        return;
      }
      setDone(
        body.publishAt
          ? `Held. It goes live ${new Date(body.publishAt).toLocaleString("en-US", {
              timeZone: "America/Chicago",
              dateStyle: "medium",
              timeStyle: "short",
            })} Central.`
          : "Live on the site now.",
      );
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  const planLines = [0, 1, 2, 3].map((i) => ride?.plan?.[i] ?? "");

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl">Ride console</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="underline">
            View site
          </Link>
          <button
            type="button"
            className="underline"
            onClick={async () => {
              await fetch("/api/admin/login", { method: "DELETE" });
              window.location.reload();
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {!storeReady || !apiKeyReady ? (
        <p className="card mt-6 p-4 text-sm" style={{ background: "#fff4e6" }}>
          {!apiKeyReady ? "ANTHROPIC_API_KEY isn't set, so reading a post won't work. " : ""}
          {!storeReady ? "BLOB_READ_WRITE_TOKEN isn't set, so publishing won't work." : ""}
        </p>
      ) : null}

      <p className="mt-4 text-sm text-ink-soft">
        {current
          ? `Live now: ${current.ride.title ?? current.ride.status} — last saved ${new Date(
              current.updatedAt,
            ).toLocaleString("en-US", { timeZone: "America/Chicago" })} Central${
              current.publishAt ? `, held until ${new Date(current.publishAt).toLocaleString("en-US", { timeZone: "America/Chicago" })}` : ""
            }.`
          : "Nothing published yet — the site is showing the built-in example ride."}
      </p>

      {/* ---- 1. the post ---- */}
      <section className="mt-8">
        <h2 className="text-xl">1. Paste the post</h2>
        {draft ? (
          <p className="mt-1.5 text-sm text-ink-soft">
            Loaded a draft from {draft.source}, received{" "}
            {new Date(draft.receivedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })}{" "}
            Central.
          </p>
        ) : null}
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          rows={12}
          placeholder="Hey friends!! Ready for another fun ride?…"
          className="field mt-3 w-full font-mono text-sm"
        />
        <button
          type="button"
          onClick={readPost}
          disabled={busy !== null || !post.trim()}
          className="btn mt-3"
        >
          {busy === "read" ? "Reading…" : "Read the post"}
        </button>
      </section>

      {error ? (
        <p role="alert" className="card mt-6 p-4 text-sm" style={{ color: "#e01226" }}>
          {error}
        </p>
      ) : null}

      {/* ---- 2. preview + edit ---- */}
      {ride ? (
        <>
          <section className="mt-10">
            <h2 className="text-xl">2. Check the card</h2>
            {notes ? (
              <p className="card mt-3 p-4 text-sm" style={{ background: "#fff4e6" }}>
                <strong>What it wasn&rsquo;t sure about:</strong> {notes}
              </p>
            ) : null}
            <div className="mt-4">
              {mounted && preview ? (
                <RideCard ride={preview} />
              ) : (
                <p className="text-sm text-ink-soft">Rendering preview…</p>
              )}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl">3. Fix anything that&rsquo;s off</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold">Status</span>
                <select
                  value={ride.status}
                  onChange={(e) => patch("status", e.target.value as RideStatus)}
                  className="field mt-1.5 w-full"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Title"
                value={ride.title ?? ""}
                onChange={(v) => patch("title", v)}
              />
              <Field
                label="Location"
                hint="pill 1"
                value={ride.location ?? ""}
                onChange={(v) => patch("location", v)}
              />
              <Field
                label="Gather"
                hint="pill 2"
                placeholder="Gather 6:00 PM"
                value={ride.gatherTime ?? ""}
                onChange={(v) => patch("gatherTime", v)}
              />
              <Field
                label="Roll"
                hint="pill 3"
                placeholder="Roll 6:30 PM"
                value={ride.rollTime ?? ""}
                onChange={(v) => patch("rollTime", v)}
              />
              <Field
                label="Image URL"
                hint="optional"
                value={ride.imageUrl ?? ""}
                onChange={(v) => patch("imageUrl", v)}
              />
            </div>

            <div className="mt-4 grid gap-4">
              <Field label="Sub" value={ride.sub ?? ""} onChange={(v) => patch("sub", v)} />
              <Field
                label="Alert"
                value={ride.alert ?? ""}
                onChange={(v) => patch("alert", v)}
              />
              <Field
                label="Note pill"
                hint="only shows on No ride / Rained out"
                value={ride.note ?? ""}
                onChange={(v) => patch("note", v)}
              />
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-bold">Da Plan</legend>
              <div className="mt-2 grid gap-3">
                {planLines.map((line, i) => (
                  <label key={i} className="block">
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => patchPlan(i, e.target.value)}
                      placeholder={`Step ${i + 1}${i > 2 ? " (optional)" : ""}`}
                      className="field w-full"
                    />
                    {line.length > PLAN_LINE_LIMIT ? (
                      <span className="text-xs" style={{ color: "#e18b12" }}>
                        {line.length} characters — over {PLAN_LINE_LIMIT}, so this will wrap
                        awkwardly on a phone.
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          {/* ---- 4. publish ---- */}
          <section className="mt-10 border-t-2 border-ink pt-6">
            <h2 className="text-xl">4. Publish</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => publish(false)}
                disabled={busy !== null}
                className="btn"
              >
                {busy === "publish" ? "Saving…" : "Publish now"}
              </button>
              <button
                type="button"
                onClick={() => publish(true)}
                disabled={busy !== null}
                className="btn btn-secondary"
              >
                Hold until Saturday noon
              </button>
            </div>
            <p className="mt-3 max-w-[60ch] text-sm text-ink-soft">
              Holding saves the card now and shows the countdown until Saturday noon Central,
              then swaps itself over. Nothing has to run at noon for that to happen.
            </p>
            {done ? (
              <p role="status" className="mt-4 text-sm font-bold" style={{ color: "#33b754" }}>
                {done}
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
