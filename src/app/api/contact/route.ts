import { NextResponse } from "next/server";
import { site } from "@/lib/content";

/**
 * Contact form handler.
 *
 * Framer's native form handler is gone, so this replaces it (handoff §8 item 2).
 * Two supported deliveries, whichever is configured:
 *   1. RESEND_API_KEY (+ optional CONTACT_FROM) — emails pedalpartylr@gmail.com
 *   2. CONTACT_WEBHOOK_URL — POSTs the JSON payload (Zapier / Make / Formspree /
 *      a Google Apps Script, whatever the automations end up using)
 *
 * With neither set the route answers 503 and the form surfaces a mailto
 * fallback, so an unconfigured deploy fails loudly instead of silently
 * swallowing messages.
 */

export const runtime = "nodejs";

type Payload = { name?: string; email?: string; message?: string; company?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot — real people never fill this in.
  if (body.company) return NextResponse.json({ ok: true });

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (name.length > 120 || message.length > 5000) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  const text = `New message from the Pedal Party site\n\nName: ${name}\nEmail: ${email}\n\n${message}\n`;

  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM ?? "Pedal Party <onboarding@resend.dev>",
          to: [site.email],
          reply_to: email,
          subject: `Pedal Party — say hi from ${name}`,
          text,
        }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}`);
      return NextResponse.json({ ok: true });
    }

    if (process.env.CONTACT_WEBHOOK_URL) {
      const res = await fetch(process.env.CONTACT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, source: "pedalparty.site" }),
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    console.error("[pedalparty] contact delivery failed:", err);
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }

  console.warn("[pedalparty] contact form is not configured — message not delivered");
  return NextResponse.json({ error: "unconfigured" }, { status: 503 });
}
