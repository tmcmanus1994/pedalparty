"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { FacebookIcon, InstagramIcon, MailIcon } from "./Icons";
import { contact, site } from "@/lib/content";
import { swatch } from "@/lib/spectrum";

const SOCIALS = [
  {
    handle: site.instagramHandle,
    label: "Instagram",
    href: site.instagram,
    Icon: InstagramIcon,
    fill: "#bc1184",
    on: "#ffffff",
  },
  {
    handle: site.facebookHandle,
    label: "Facebook",
    href: site.facebook,
    Icon: FacebookIcon,
    fill: "#359fb5",
    on: "#222222",
  },
  {
    handle: site.email,
    label: "Email",
    href: `mailto:${site.email}`,
    Icon: MailIcon,
    fill: "#5f13a9",
    on: "#ffffff",
  },
];

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 border-y-[3px] border-ink bg-peach">
      <div className="shell band">
        <Reveal className="text-center">
          <h2 className="h-section font-display">
            <span style={{ color: "#5f13a9" }}>{contact.headingLead.trim()}</span>{" "}
            <span aria-hidden="true">{contact.headingEmoji}</span>
          </h2>
          <p className="sub-section mx-auto mt-2">{contact.sub}</p>
        </Reveal>

        <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-9">
          <ul className="space-y-3.5">
            {SOCIALS.map((social, i) => (
              <Reveal as="li" key={social.label} delay={i * 70}>
                <a
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noreferrer noopener" : undefined}
                  className="flex items-center gap-3.5 rounded-[16px] border-[3px] border-ink px-4 py-3.5 shadow-[var(--card-shadow-sm)] transition-transform duration-150 hover:-translate-x-px hover:-translate-y-px active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                  style={{ background: social.fill, color: social.on }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink"
                    aria-hidden="true"
                  >
                    <social.Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[0.95rem] font-extrabold">
                      {social.handle}
                    </span>
                    <span className="block text-[0.78rem] font-medium opacity-90">
                      {social.label}
                    </span>
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={80}>
            <form onSubmit={onSubmit} className="card p-5 sm:p-7" noValidate={false}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block font-display text-sm font-bold">
                    {contact.fields.name.label}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    maxLength={120}
                    autoComplete="name"
                    placeholder={contact.fields.name.placeholder}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block font-display text-sm font-bold">
                    {contact.fields.email.label}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                    placeholder={contact.fields.email.placeholder}
                    className="field"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="message" className="mb-1.5 block font-display text-sm font-bold">
                  {contact.fields.message.label}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  maxLength={5000}
                  placeholder={contact.fields.message.placeholder}
                  className="field resize-y"
                />
              </div>

              {/* honeypot */}
              <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={status === "sending"}
                  style={{ opacity: status === "sending" ? 0.7 : 1 }}
                  data-spectrum={swatch(0).name}
                >
                  {status === "sending" ? "Sending…" : contact.submit}
                </button>

                {/* ⚠️ Placeholder microcopy — final strings TBD (handoff §8 item 4). */}
                <p aria-live="polite" className="text-[0.9rem] font-semibold">
                  {status === "sent" ? (
                    <span style={{ color: "#1e7a38" }}>{contact.successPlaceholder}</span>
                  ) : null}
                  {status === "error" ? (
                    <span style={{ color: "#c40e20" }}>
                      {contact.errorPlaceholder}{" "}
                      <a href={`mailto:${site.email}`} className="underline underline-offset-2">
                        {site.email}
                      </a>
                    </span>
                  ) : null}
                </p>
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
