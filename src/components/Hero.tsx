import { HERO_PHOTO } from "./HeroBackdrop";
import { hero } from "@/lib/content";
import { findBrandLogo } from "@/lib/brandLogo";

/** The hero backdrop when no photo is set — the warm cream already in the
 *  palette (`--color-cream-deep`), a shade deeper than the page below it so
 *  the two read as separate surfaces. */
const HERO_BG = "#fff4e6";

/**
 * Hero — the logo on a flat backdrop.
 *
 * The v2 mark is fully transparent, so whatever sits behind it shows through
 * the spokes and the counters of "PEDAL PARTY". A flat field is the point: the
 * lettering reads cleanly and nothing competes with the watercolour. On the
 * cream backdrop those counters read as cream — the mark the way it was drawn.
 *
 * If a real riverfront photo is ever set via HERO_PHOTO, the photo takes over
 * and gets the duotone wash plus a scrim. (HeroBackdrop.tsx still exports the
 * poster illustration that used to fill this slot, kept in case it's wanted
 * back — nothing imports it today.)
 */
export default function Hero() {
  const photo = HERO_PHOTO;
  const logo = findBrandLogo();

  return (
    <section
      className="relative isolate flex min-h-[92svh] items-center justify-center overflow-hidden pt-[var(--header-h)]"
      style={photo ? undefined : { background: HERO_BG }}
    >
      {photo ? (
        <>
          <img
            src={`/images/${photo.base}-${photo.widths[photo.widths.length - 1]}.jpg`}
            srcSet={photo.widths.map((w) => `/images/${photo.base}-${w}.jpg ${w}w`).join(", ")}
            sizes="100vw"
            alt={photo.alt}
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          {/* duotone wash — only meaningful over a photo */}
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
          {/* bottom-weighted scrim for type legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg,rgba(10,2,24,0.55) 0%,rgba(10,2,24,0.28) 32%,rgba(10,2,24,0.45) 66%,rgba(10,2,24,0.75) 100%)",
            }}
          />
        </>
      ) : null}

      <div className="shell relative flex flex-col items-center py-24 text-center">
        <p
          className="pill sticker hero-lift !border-[3px] !px-5 !py-2 !text-[0.92rem] uppercase tracking-[0.1em] text-ink"
          style={{ "--tilt": "-3deg", background: "#e1c718" } as React.CSSProperties}
        >
          {hero.badge}
        </p>

        {/* The logo IS the h1 — the wordmark is the fallback if no artwork is
            present in /public/images (see src/lib/brandLogo.ts). */}
        <h1 className="mt-5 w-full">
          {logo ? (
            <picture>
              {logo.webp ? <source type="image/webp" srcSet={logo.webp} /> : null}
              {/* Near-square (623x613), so capping the width by 46svh also caps
                  its height on short viewports. */}
              <img
                src={logo.src}
                width={logo.width}
                height={logo.height}
                alt={hero.title}
                fetchPriority="high"
                className="hero-lift-lg mx-auto block h-auto w-[min(74vw,24rem,46svh)] max-w-full"
              />
            </picture>
          ) : (
            <span className="text-sticker hero-lift-lg block text-[clamp(3.4rem,15vw,8.5rem)] leading-[0.92]">
              {hero.title}
            </span>
          )}
        </h1>

        {/* One sentence, one line. "SOCIAL RIDE." stays caps but sits inside the
            sentence — heavier and in brand purple rather than a separate pill. */}
        <p className="hero-lift mt-6 max-w-[46ch] text-balance text-[clamp(1.05rem,2.35vw,1.45rem)] font-bold leading-[1.4] text-ink lg:max-w-none lg:whitespace-nowrap">
          {hero.subtitleLead}{" "}
          {/* Purple, not the brand yellow — yellow on cream is 1.56:1. */}
          <span className="font-extrabold tracking-[0.06em]" style={{ color: "#5f13a9" }}>
            {hero.subtitleEmphasis}
          </span>
        </p>

        <div className="hero-lift mt-9 flex flex-wrap items-center justify-center gap-3.5">
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
