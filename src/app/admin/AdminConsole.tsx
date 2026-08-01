"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RideCard } from "@/components/NextRide";
import { STATUSES, withCountdown, type RideContent, type RideStatus } from "@/lib/ride";
import type { StoredDraft, StoredRide } from "@/lib/rideStore";

/**
 * The weekly job: look at the draft, fix anything that's off, publish.
 *
 * Drafts arrive from outside the site through `POST /api/ride`. Nothing here
 * writes copy — it renders what came in, lets you edit every field, and shows
 * the result in the real `RideCard` the homepage uses rather than a mockup of
 * it, so what you approve is exactly what ships.
 *
 * With no draft the fields start blank and you type the ride yourself.
 */

const BLANK: RideContent = { status: "Schedule" };

/** Plan lines longer than this get cramped on a phone. Advisory, not enforced. */
const PLAN_LINE_LIMIT = 75;

const centralTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });

type Props = {
  draft: StoredDraft | null;
  current: StoredRide | null;
  storeReady: boolean;
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

export default function AdminConsole({ draft, current, storeReady }: Props) {
  const [ride, setRide] = useState<RideContent>(draft?.ride ?? BLANK);
  const [hasDraft, setHasDraft] = useState(Boolean(draft));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  // The preview's countdown comes off the clock, so render it after mount —
  // otherwise the server and the client disagree about the target.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const preview = useMemo(() => withCountdown(ride), [ride]);

  function patch(key: keyof RideContent, value: string) {
    setRide((r) => ({ ...r, [key]: value }));
    setDone("");
  }

  function patchPlan(index: number, value: string) {
    setRide((r) => {
      const plan = [...(r.plan ?? [])];
      plan[index] = value;
      return { ...r, plan };
    });
    setDone("");
  }

  async function publish(hold: boolean) {
    setBusy(true);
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
      setHasDraft(false);
      setDone(
        body.publishAt
          ? `Held. It goes live ${centralTime(body.publishAt)} Central.`
          : "Live on the site now.",
      );
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function discardDraft() {
    setBusy(true);
    setError("");
    try {
      await fetch("/api/admin/draft", { method: "DELETE" });
      setHasDraft(false);
      setRide(BLANK);
      setDone("Draft discarded. Nothing on the site changed.");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  function loadLive() {
    if (!current) return;
    setRide(current.ride);
    setDone("");
  }

  const planLines = [0, 1, 2, 3].map((i) => ride.plan?.[i] ?? "");

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

      {!storeReady ? (
        <p className="card mt-6 p-4 text-sm" style={{ background: "#fff4e6" }}>
          BLOB_READ_WRITE_TOKEN isn&rsquo;t set, so publishing won&rsquo;t work.
        </p>
      ) : null}

      {/* ---- what's live, and what's waiting ---- */}
      <section className="mt-6">
        <p className="text-sm text-ink-soft">
          {current ? (
            <>
              <strong>Live now:</strong> {current.ride.title ?? current.ride.status} — saved{" "}
              {centralTime(current.updatedAt)} Central
              {current.publishAt ? `, held until ${centralTime(current.publishAt)}` : ""}.{" "}
              <button type="button" onClick={loadLive} className="underline">
                Load it into the form
              </button>
            </>
          ) : (
            "Nothing published yet — the site is showing the built-in example ride."
          )}
        </p>

        {hasDraft && draft ? (
          <div className="card mt-4 p-4" style={{ background: "#fff4e6" }}>
            <p className="text-sm">
              <strong>Draft waiting</strong> from {draft.source}, received{" "}
              {centralTime(draft.receivedAt)} Central. It is not on the site.
            </p>
            {draft.notes ? (
              <p className="mt-2 text-sm">
                <strong>Notes from the sender:</strong> {draft.notes}
              </p>
            ) : null}
            <button
              type="button"
              onClick={discardDraft}
              disabled={busy}
              className="mt-2 text-sm underline"
            >
              Discard this draft
            </button>
          </div>
        ) : null}
      </section>

      {error ? (
        <p role="alert" className="card mt-6 p-4 text-sm" style={{ color: "#e01226" }}>
          {error}
        </p>
      ) : null}

      {/* ---- preview ---- */}
      <section className="mt-10">
        <h2 className="text-xl">1. Check the card</h2>
        <div className="mt-4">
          {mounted ? (
            <RideCard ride={preview} />
          ) : (
            <p className="text-sm text-ink-soft">Rendering preview…</p>
          )}
        </div>
      </section>

      {/* ---- edit ---- */}
      <section className="mt-10">
        <h2 className="text-xl">2. Fix anything that&rsquo;s off</h2>
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
          <Field label="Title" value={ride.title ?? ""} onChange={(v) => patch("title", v)} />
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
          <Field label="Alert" value={ride.alert ?? ""} onChange={(v) => patch("alert", v)} />
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

      {/* ---- publish ---- */}
      <section className="mt-10 border-t-2 border-ink pt-6">
        <h2 className="text-xl">3. Publish</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => publish(false)} disabled={busy} className="btn">
            {busy ? "Saving…" : "Publish now"}
          </button>
          <button
            type="button"
            onClick={() => publish(true)}
            disabled={busy}
            className="btn btn-secondary"
          >
            Hold until Saturday noon
          </button>
        </div>
        <p className="mt-3 max-w-[60ch] text-sm text-ink-soft">
          Holding saves the card now and shows the countdown until Saturday noon Central, then
          swaps itself over. Nothing has to run at noon for that to happen.
        </p>
        {done ? (
          <p role="status" className="mt-4 text-sm font-bold" style={{ color: "#33b754" }}>
            {done}
          </p>
        ) : null}
      </section>
    </div>
  );
}
