import Countdown from "./Countdown";
import Reveal from "./Reveal";
import { nextRideSection } from "@/lib/content";
import { swatch } from "@/lib/spectrum";
import type { Ride } from "@/lib/ride";

/**
 * Next Ride (handoff §5). Exactly one state renders, chosen by `ride.status`.
 * A / C / D / E are variants of one status card; B is the ride-detail card.
 */

type StatusCopy = {
  heading: React.ReactNode;
  sub: React.ReactNode;
  defaultNote?: string;
  countdownLabel: string;
};

const STATUS_COPY: Record<Exclude<Ride["status"], "Schedule">, StatusCopy> = {
  Waiting: {
    heading: (
      <>
        Next ride drops <span style={{ color: "#bc1184" }}>Saturday at noon.</span>
      </>
    ),
    sub: "Every Monday. Gather at 6, roll at 6:30. Location announced right here.",
    countdownLabel: "Time until the next ride plan drops",
  },
  NoRide: {
    heading: (
      <>
        <span style={{ color: "#bc1184" }}>No ride this week</span> — catch you next
        Monday. <span aria-hidden="true">🚲</span>
      </>
    ),
    sub: "The next plan drops Saturday at noon.",
    defaultNote: "📝 Taking Labor Day off — rest those legs!",
    countdownLabel: "Time until the next ride plan drops",
  },
  RainedOut: {
    heading: (
      <>
        <span style={{ color: "#c40e20" }}>Rained out!</span>{" "}
        <span aria-hidden="true">⛈️</span>
      </>
    ),
    sub: "This week's ride is canceled — safety first. We'll be back next Monday.",
    defaultNote: "📝 Radar says 100% thunderstorms at roll-out. Boo.",
    countdownLabel: "Time until the next ride plan drops",
  },
  Hibernating: {
    heading: (
      <>
        Pedal Party is <span style={{ color: "#1f6e80" }}>hibernating.</span>{" "}
        <span aria-hidden="true">🐻</span>
      </>
    ),
    sub: (
      <>
        We ride again on <strong className="font-semibold text-ink">April Fools&rsquo; Day</strong>{" "}
        — no joke. See you at golden hour.
      </>
    ),
    countdownLabel: "Time until the season opener",
  },
};

function StatusCard({ ride }: { ride: Ride }) {
  const copy = STATUS_COPY[ride.status as keyof typeof STATUS_COPY];
  const note = ride.note ?? copy.defaultNote;

  return (
    <div className="card mx-auto max-w-2xl p-6 text-center sm:p-9">
      <h3 className="font-display text-[clamp(1.35rem,4.6vw,2rem)] leading-tight">
        {copy.heading}
      </h3>
      <p className="mx-auto mt-3 max-w-[46ch] text-[0.95rem] text-ink-soft">{copy.sub}</p>

      {note ? (
        <p
          className="pill sticker mx-auto mt-5 max-w-full !whitespace-normal text-center"
          style={{ "--tilt": "-1.5deg", background: "#dbf9ff" } as React.CSSProperties}
        >
          {note}
        </p>
      ) : null}

      <div className="mt-7">
        <Countdown target={ride.countdownTarget} label={copy.countdownLabel} />
      </div>
    </div>
  );
}

function Polaroid({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="sticker relative mx-auto w-full max-w-[22rem] rounded-[10px] border-[3px] border-ink bg-paper p-3 pb-12 shadow-[var(--card-shadow)] lg:mx-0"
      style={{ "--tilt": "-3deg" } as React.CSSProperties}
    >
      {/* washi tape */}
      <img
        src="/images/tape.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 left-1/2 w-28 -translate-x-1/2 rotate-[-4deg] opacity-95"
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="aspect-[3/4] w-full rounded-[4px] border-2 border-ink object-cover"
      />
    </div>
  );
}

function RideDetailCard({ ride }: { ride: Ride }) {
  const chips = [
    ride.location ? `📍 ${ride.location}` : null,
    ride.gatherTime ? `🕕 ${ride.gatherTime}` : null,
    ride.rollTime ? `🚲 ${ride.rollTime}` : null,
  ].filter((c): c is string => Boolean(c));

  return (
    <div className="card mx-auto max-w-4xl p-5 sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-9">
        {ride.imageUrl ? (
          <Polaroid src={ride.imageUrl} alt={`Flyer for this Monday's ride: ${ride.title ?? ""}`} />
        ) : null}

        <div className="min-w-0">
          <p className="eyebrow" style={{ color: "#c40e20" }}>
            THIS MONDAY&rsquo;S RIDE
          </p>
          <h3 className="mt-1.5 font-display text-[clamp(1.6rem,5vw,2.4rem)] leading-tight text-purple">
            {ride.title}
          </h3>
          {ride.sub ? (
            <p className="mt-2 max-w-[52ch] text-[0.95rem] text-ink-soft">{ride.sub}</p>
          ) : null}

          {chips.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <li key={chip}>
                  <span className="pill">{chip}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {ride.plan?.length ? (
            <div className="mt-6">
              <h4 className="font-display text-lg">Da Plan</h4>
              <ol className="mt-3 space-y-3">
                {ride.plan.map((step, i) => {
                  const s = swatch(i);
                  return (
                    <li key={step} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-sm font-extrabold shadow-[var(--card-shadow-xs)]"
                        style={{ background: s.fill, color: s.on }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[0.95rem] leading-snug">{step}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}

          {ride.alert ? (
            <div
              className="card-sm mt-6 p-4"
              style={{ background: "#dbf9ff" }}
              role="note"
            >
              <p className="font-display text-sm font-extrabold">
                <span aria-hidden="true">⚠️</span> Heads up
              </p>
              <p className="mt-1 text-[0.95rem] leading-snug">{ride.alert}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function NextRide({ ride }: { ride: Ride }) {
  return (
    <section id="next-ride" className="band scroll-mt-24 bg-cream">
      <div className="shell">
        <Reveal>
          <h2 className="h-section font-display">
            Next <span style={{ color: "#bc1184" }}>Ride</span>
          </h2>
          <p className="sub-section mt-2">{nextRideSection.sub}</p>
        </Reveal>

        <Reveal delay={80} className="mt-8">
          {ride.status === "Schedule" ? (
            <RideDetailCard ride={ride} />
          ) : (
            <StatusCard ride={ride} />
          )}
        </Reveal>
      </div>
    </section>
  );
}
