"use client";

import { useState } from "react";

export default function SignIn() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Full reload so the page re-renders server-side with the cookie set.
        window.location.reload();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        body.error === "not_configured"
          ? "ADMIN_PASSWORD isn't set on the server."
          : "That password didn't work.",
      );
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-24 max-w-sm p-7">
      <h1 className="text-2xl">Ride console</h1>
      <p className="mt-2 text-sm text-ink-soft">Password, please.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        autoComplete="current-password"
        aria-label="Admin password"
        className="field mt-5 w-full"
      />
      {error ? (
        <p role="alert" className="mt-3 text-sm" style={{ color: "#e01226" }}>
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="btn mt-5 w-full">
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
