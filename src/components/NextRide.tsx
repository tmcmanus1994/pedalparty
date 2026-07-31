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
        <span style={{ color: "#e01226" }}>Rained out!</span>{" "}
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
        Pedal Party is <span style={{ color: "#359fb5" }}>hibernating.</span>{" "}
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
    <div className="card mx-auto max-w-2xl p-7 text-center sm:p-10">
      <h3 className="text-[clamp(1.5rem,4.8vw,2.15rem)] leading-[1.15]">{copy.heading}</h3>
      <p className="mx-auto mt-3.5 max-w-[46ch] text-ink-soft">{copy.sub}</p>

      {note ? (
        <p
          className="pill sticker mx-auto mt-6 max-w-full !whitespace-normal text-center"
          style={{ "--tilt": "-1.5deg", background: "#fff4e6" } as React.CSSProperties}
        >
          {note}
        </p>
      ) : null}

      <div className="mt-8">
        <Countdown target={ride.countdownTarget} label={copy.countdownLabel} />
      </div>
    </div>
  );
}

function Polaroid({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="sticker relative mx-auto w-full max-w-[24rem] rounded-[10px] border-[3px] border-ink bg-paper p-3 pb-12 shadow-[var(--card-shadow)] lg:mx-0"
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
    <div className="card p-6 sm:p-9 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-center lg:gap-12">
        {ride.imageUrl ? (
          <Polaroid src={ride.imageUrl} alt={`Flyer for this Monday's ride: ${ride.title ?? ""}`} />
        ) : null}

        <div className="min-w-0">
          <p className="eyebrow" style={{ color: "#e01226" }}>
            THIS MONDAY&rsquo;S RIDE
          </p>
          <h3 className="mt-2 text-[clamp(1.7rem,5vw,2.5rem)] leading-[1.12] text-purple">
            {ride.title}
          </h3>
          {ride.sub ? (
            <p className="mt-2.5 max-w-[50ch] text-ink-soft">{ride.sub}</p>
          ) : null}

          {chips.length ? (
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {chips.map((chip) => (
                <li key={chip}>
                  <span className="pill">{chip}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {ride.plan?.length ? (
            <div className="mt-7">
              <h4 className="text-xl">Da Plan</h4>
              <ol className="mt-4 space-y-3.5">
                {ride.plan.map((step, i) => {
                  const s = swatch(i);
                  return (
                    <li key={step} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-[3px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink text-sm font-extrabold leading-none shadow-[var(--card-shadow-xs)]"
                        style={{ background: s.fill, color: s.on }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-body-sm leading-[1.45]">{step}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}

          {ride.alert ? (
            <div
              className="card-sm mt-7 p-4.5"
              style={{ background: "#fff4e6" }}
              role="note"
            >
              <p className="text-[0.95rem] font-extrabold uppercase tracking-[0.05em]">
                <span aria-hidden="true">⚠️</span> Heads up
              </p>
              <p className="mt-1.5 text-body-sm leading-[1.45]">{ride.alert}</p>
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
        <Reveal className="section-head">
          <h2 className="h-section">
            Next <span style={{ color: "#bc1184" }}>Ride</span>
          </h2>
          <p className="sub-section">{nextRideSection.sub}</p>
        </Reveal>

        <Reveal delay={80} className="section-body">
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
