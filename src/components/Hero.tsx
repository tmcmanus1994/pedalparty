import HeroPoster, { HERO_PHOTO } from "./HeroBackdrop";
import { hero } from "@/lib/content";
import { findBrandLogo } from "@/lib/brandLogo";

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
  const logo = findBrandLogo();

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

      {/* Pool of shadow behind the logo. The v2 mark is fully transparent, so
          the counters of "PEDAL PARTY" are holes — without this the bridge
          truss and skyline read straight through the lettering. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-[min(76svh,36rem)] w-[min(94vw,36rem)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle,rgba(8,2,20,0.82) 0%,rgba(8,2,20,0.72) 42%,rgba(8,2,20,0.35) 62%,rgba(8,2,20,0) 74%)",
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

      <div className="shell relative flex flex-col items-center py-24 text-center">
        <p
          className="pill sticker !border-[3px] !px-5 !py-2 !text-[0.92rem] uppercase tracking-[0.1em] text-ink"
          style={{ "--tilt": "-3deg", background: "#e1c718" } as React.CSSProperties}
        >
          {hero.badge}
        </p>

        {/* The logo IS the h1 — the wordmark below is the fallback until the
            artwork lands in /public/images (see src/lib/brandLogo.ts). */}
        <h1 className="mt-5 w-full">
          {logo ? (
            <picture>
              {logo.webp ? <source type="image/webp" srcSet={logo.webp} /> : null}
              <img
                src={logo.src}
                width={logo.width}
                height={logo.height}
                alt={hero.title}
                fetchPriority="high"
                className="mx-auto h-auto max-h-[46svh] w-[min(74vw,24rem)] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
              />
            </picture>
          ) : (
            <span className="text-sticker block text-[clamp(3.4rem,15vw,8.5rem)] leading-[0.92]">
              {hero.title}
            </span>
          )}
        </h1>

        {/* One sentence, one line. "SOCIAL RIDE." stays caps but sits inside the
            sentence — heavier and in brand yellow rather than a separate pill. */}
        <p className="mt-6 max-w-[46ch] text-balance text-[clamp(1.05rem,2.35vw,1.45rem)] font-bold leading-[1.4] text-white drop-shadow-[0_2px_6px_rgba(34,10,60,0.9)] lg:max-w-none lg:whitespace-nowrap">
          {hero.subtitleLead}{" "}
          <span className="font-extrabold tracking-[0.06em]" style={{ color: "#e1c718" }}>
            {hero.subtitleEmphasis}
          </span>
        </p>

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
