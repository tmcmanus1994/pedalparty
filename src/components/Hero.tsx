import HeroPoster, { HERO_PHOTO } from "./HeroBackdrop";
import { hero } from "@/lib/content";

/**
 * Hero — full-bleed backdrop under a duotone wash (deep purple shadows / warm
 * highlight) plus a bottom-weighted scrim, so the badge, title and buttons pop
 * while the scene behind them stays readable.
 *
 * The backdrop is the poster illustration until the real riverfront photo
 * arrives — see HeroBackdrop.tsx for the one-line swap.
 */
export default function Hero() {
  const photo = HERO_PHOTO;

  return (
    <section className="relative isolate flex min-h-[92svh] items-center justify-center overflow-hidden pt-[var(--header-h)]">
      {photo ? (
        <img
          src={`/images/${photo.base}-${photo.widths[photo.widths.length - 1]}.jpg`}
          srcSet={photo.widths.map((w) => `/images/${photo.base}-${w}.jpg ${w}w`).join(", ")}
          sizes="100vw"
          alt={photo.alt}
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
      ) : (
        <HeroPoster />
      )}

      {/* duotone wash — only meaningful over a photo */}
      {photo ? (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 mix-blend-multiply"
            style={{ background: "linear-gradient(180deg,#7b3fbd 0%,#5f13a9 100%)" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 mix-blend-screen opacity-70"
            style={{
              background: "linear-gradient(180deg,#ffdca8 0%,#ff9d5c 55%,#2a0a4a 100%)",
            }}
          />
        </>
      ) : null}

      {/* bottom-weighted scrim for type legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg,rgba(34,10,60,0.42) 0%,rgba(34,10,60,0.10) 30%,rgba(34,10,60,0.30) 62%,rgba(34,10,60,0.62) 100%)",
        }}
      />

      <div className="shell relative flex flex-col items-center py-24 text-center">
        <p
          className="pill sticker !border-[3px] !px-5 !py-2 !text-[0.92rem] uppercase tracking-[0.1em] text-ink"
          style={{ "--tilt": "-3deg", background: "#e1c718" } as React.CSSProperties}
        >
          {hero.badge}
        </p>

        <h1 className="text-sticker mt-5 text-[clamp(3.4rem,15vw,8.5rem)] leading-[0.92]">
          {hero.title}
        </h1>

        <div className="mt-7 flex flex-col items-center gap-4">
          <p className="max-w-[24ch] text-balance text-[clamp(1.15rem,3.8vw,1.5rem)] font-bold leading-[1.35] text-white drop-shadow-[0_2px_6px_rgba(34,10,60,0.9)] sm:max-w-[36ch]">
            {hero.subtitleLead}
          </p>
          <p
            className="pill sticker !border-[3px] !px-5 !py-2 !text-[clamp(1.05rem,3.6vw,1.3rem)] uppercase tracking-[0.08em] text-white"
            style={{ "--tilt": "2deg", background: "#5f13a9" } as React.CSSProperties}
          >
            {hero.subtitleEmphasis}
          </p>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
          <a href="#next-ride" className="btn btn-primary">
            {hero.primaryCta}
          </a>
          <a href="#about" className="btn btn-secondary">
            {hero.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}
