"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { FacebookIcon, InstagramIcon, MailIcon } from "./Icons";
import { contact, site } from "@/lib/content";
import { BRAND, onBrand } from "@/lib/spectrum";

const SOCIALS = [
  {
    handle: site.instagramHandle,
    label: "Instagram",
    href: site.instagram,
    Icon: InstagramIcon,
    fill: BRAND.magenta,
    on: onBrand(BRAND.magenta),
  },
  {
    handle: site.facebookHandle,
    label: "Facebook",
    href: site.facebook,
    Icon: FacebookIcon,
    fill: BRAND.teal,
    on: onBrand(BRAND.teal),
  },
  {
    handle: site.email,
    label: "Email",
    href: `mailto:${site.email}`,
    Icon: MailIcon,
    fill: BRAND.purple,
    on: onBrand(BRAND.purple),
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
        <Reveal className="section-head">
          <h2 className="section-title">
            <span style={{ color: BRAND.purple }}>{contact.headingLead.trim()}</span>{" "}
            <span aria-hidden="true">{contact.headingEmoji}</span>
          </h2>
          <p className="sub-section">{contact.sub}</p>
        </Reveal>

        <div className="section-body grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-8">
          <ul className="space-y-4">
            {SOCIALS.map((social, i) => (
              <Reveal as="li" key={social.label} delay={i * 70}>
                <a
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noreferrer noopener" : undefined}
                  className="flex items-center gap-3.5 rounded-[16px] border-[3px] border-ink px-4 py-4 shadow-[var(--card-shadow-sm)] transition-transform duration-150 hover:-translate-x-px hover:-translate-y-px active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                  style={{ background: social.fill, color: social.on }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink"
                    aria-hidden="true"
                  >
                    <social.Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[1.02rem] font-extrabold leading-tight">
                      {social.handle}
                    </span>
                    <span className="block text-[0.85rem] leading-tight opacity-90">
                      {social.label}
                    </span>
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={80}>
            <form onSubmit={onSubmit} className="card p-6 sm:p-8" noValidate={false}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="field-label">
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
                  <label htmlFor="email" className="field-label">
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

              <div className="mt-5">
                <label htmlFor="message" className="field-label">
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

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={status === "sending"}
                  style={{ opacity: status === "sending" ? 0.7 : 1 }}
                >
                  {status === "sending" ? "Sending…" : contact.submit}
                </button>

                {/* ⚠️ Placeholder microcopy — final strings TBD (handoff §8 item 4). */}
                <p aria-live="polite" className="text-body-sm font-bold">
                  {status === "sent" ? (
                    <span className="text-ink">{contact.successPlaceholder}</span>
                  ) : null}
                  {status === "error" ? (
                    <span style={{ color: BRAND.red }}>
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
