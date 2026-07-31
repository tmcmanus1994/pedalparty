import Reveal from "./Reveal";
import { CheckIcon, CrossIcon } from "./Icons";
import { rideSmart } from "@/lib/content";

type ListCardProps = {
  title: string;
  items: readonly string[];
  tone: "do" | "dont";
  delay: number;
};

function ListCard({ title, items, tone, delay }: ListCardProps) {
  const isDo = tone === "do";
  const chipBg = isDo ? "#33b754" : "#e01226";
  const chipFg = isDo ? "#222222" : "#ffffff";
  const headingColor = isDo ? "#1e7a38" : "#c40e20";
  const Marker = isDo ? CheckIcon : CrossIcon;

  return (
    <Reveal as="li" delay={delay} className="h-full">
      <div className="card flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink shadow-[var(--card-shadow-xs)]"
            style={{ background: chipBg, color: chipFg }}
          >
            <Marker className="h-4 w-4" />
          </span>
          <h3 className="font-display text-xl" style={{ color: headingColor }}>
            {title}
          </h3>
        </div>

        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ background: chipBg, color: chipFg }}
              >
                <Marker className="h-3 w-3" />
              </span>
              <span className="text-[0.93rem] leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

export default function RideSmart() {
  return (
    <section id="safety" className="band scroll-mt-24 bg-cream">
      <div className="shell">
        <Reveal>
          <h2 className="h-section font-display">
            Ride <span style={{ color: "#1e7a38" }}>Smart</span>
          </h2>
          <p className="sub-section mt-2">{rideSmart.sub}</p>
        </Reveal>

        {/* DO first on mobile, equal heights on desktop */}
        <ul className="mt-8 grid items-stretch gap-5 md:grid-cols-2 md:gap-6">
          <ListCard title={rideSmart.doTitle} items={rideSmart.dos} tone="do" delay={0} />
          <ListCard title={rideSmart.dontTitle} items={rideSmart.donts} tone="dont" delay={80} />
        </ul>

        <Reveal delay={140}>
          <p className="mx-auto mt-7 max-w-[62ch] text-center text-[0.88rem] text-ink-soft">
            <span aria-hidden="true">🔧</span> {rideSmart.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
