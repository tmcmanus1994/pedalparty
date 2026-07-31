"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { PlusIcon } from "./Icons";
import { faq } from "@/lib/content";

/**
 * "Good Questions" accordion — one item open at a time, plus rotates to ×,
 * answer panel takes the ice-blue callout fill, 56px+ tap targets.
 */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="band scroll-mt-24 bg-cream">
      <div className="shell">
        <Reveal className="section-head">
          <h2 className="h-section">
            Good <span style={{ color: "#1f6e80" }}>Questions</span>
          </h2>
          <p className="sub-section">{faq.sub}</p>
        </Reveal>

        <ul className="section-body mx-auto max-w-3xl space-y-3.5">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal as="li" key={item.q} delay={i * 40}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-trigger-${i}`}
                    className="card-sm flex min-h-[60px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-[1.08rem] font-bold leading-snug transition-transform duration-150 hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:text-[1.15rem]"
                    style={{
                      borderBottomLeftRadius: isOpen ? 0 : undefined,
                      borderBottomRightRadius: isOpen ? 0 : undefined,
                      background: isOpen ? "#dbf9ff" : "#fff",
                    }}
                  >
                    <span>{item.q}</span>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink text-ink transition-transform duration-200"
                      style={{
                        background: isOpen ? "#e1c718" : "#fff",
                        transform: isOpen ? "rotate(135deg)" : "none",
                      }}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </span>
                  </button>
                </h3>

                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  hidden={!isOpen}
                  className="rounded-b-[14px] border-x-[3px] border-b-[3px] border-ink px-5 pb-5 pt-4 shadow-[var(--card-shadow-sm)]"
                  style={{ background: "#dbf9ff" }}
                >
                  <p className="text-body-sm leading-[1.6]">{item.a}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
