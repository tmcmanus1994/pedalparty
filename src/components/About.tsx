import Reveal from "./Reveal";
import { about, stats, tagline } from "@/lib/content";
import { swatch } from "@/lib/spectrum";

const TAGLINE_COLOR: Record<(typeof tagline)[number]["tone"], string> = {
  coral: "#ff7a6e",
  lime: "#5fe07e",
  pink: "#ff7acb",
};

export default function About() {
  return (
    <section id="about" className="scroll-mt-24 bg-purple text-white">
      <div className="shell pb-14 pt-[var(--spacing-section)] md:pt-[var(--spacing-section-lg)]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
          <Reveal>
            <h2 className="h-section text-balance">{about.heading}</h2>
            <div className="mt-5 space-y-4 leading-[1.6] text-white/90">
              {about.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <p className="mt-7 text-xl font-bold">
              {about.closerLead}
              <a
                href="#contact"
                className="underline decoration-[3px] underline-offset-4"
                style={{ color: "#ffd84d" }}
              >
                {about.closerLink}
              </a>
              {about.closerTail}
            </p>
          </Reveal>

          <ul className="grid grid-cols-2 gap-3 self-center sm:gap-4">
            {stats.map((stat, i) => {
              const s = swatch(i);
              return (
                <Reveal as="li" key={stat.label} delay={i * 60}>
                  <div
                    className="sticker flex h-full flex-col items-center justify-center rounded-[18px] border-[3px] border-ink px-3 py-5 text-center shadow-[var(--card-shadow-sm)]"
                    style={
                      {
                        background: s.fill,
                        color: s.on,
                        "--tilt": `${i % 2 === 0 ? -2 : 2}deg`,
                      } as React.CSSProperties
                    }
                  >
                    <span className="text-[clamp(1.45rem,4.6vw,1.95rem)] font-extrabold leading-none">
                      {stat.value}
                    </span>
                    <span className="mt-2 text-[0.68rem] font-bold uppercase leading-tight tracking-[0.1em]">
                      {stat.label}
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Tagline strip — same purple band, its own rhythm slot. */}
      <Reveal className="shell pb-[var(--spacing-section)] text-center md:pb-[var(--spacing-section-lg)]">
        <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[clamp(1.7rem,5.8vw,2.9rem)] font-extrabold">
          {tagline.map((part) => (
            <span key={part.text} style={{ color: TAGLINE_COLOR[part.tone] }}>
              {part.text}
            </span>
          ))}
        </p>
      </Reveal>
    </section>
  );
}
