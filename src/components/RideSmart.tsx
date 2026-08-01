import Reveal from "./Reveal";
import { CheckIcon, CrossIcon } from "./Icons";
import { rideSmart } from "@/lib/content";
import { BRAND, onBrand } from "@/lib/spectrum";

type ListCardProps = {
  title: string;
  items: readonly string[];
  tone: "do" | "dont";
  delay: number;
};

function ListCard({ title, items, tone, delay }: ListCardProps) {
  const isDo = tone === "do";
  const chipBg = isDo ? BRAND.green : BRAND.red;
  const chipFg = onBrand(chipBg);
  const Marker = isDo ? CheckIcon : CrossIcon;

  return (
    <Reveal as="li" delay={delay} className="h-full">
      <div className="card flex h-full flex-col p-6 sm:p-7">
        {/* The heading rides on a brand fill rather than being coloured type —
            green and red are fill colours, and neither carries as text on white. */}
        <h3
          className="inline-flex items-center gap-2.5 self-start rounded-full border-[3px] border-ink px-4 py-1.5 text-xl uppercase tracking-[0.06em] shadow-[var(--card-shadow-xs)]"
          style={{ background: chipBg, color: chipFg }}
        >
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-paper text-ink"
          >
            <Marker className="h-3.5 w-3.5" />
          </span>
          {title}
        </h3>

        <ul className="mt-6 space-y-3.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex h-[1.45em] shrink-0 items-center text-body-sm"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: chipBg, color: chipFg }}
                >
                  <Marker className="h-3 w-3" />
                </span>
              </span>
              <span className="text-body-sm leading-[1.45]">{item}</span>
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
        <Reveal className="section-head">
          <h2 className="section-title">
            Ride <span style={{ color: "#5f13a9" }}>Smart</span>
          </h2>
          <p className="sub-section">{rideSmart.sub}</p>
        </Reveal>

        {/* DO first on mobile, equal heights on desktop */}
        <ul className="section-body grid items-stretch gap-6 md:grid-cols-2">
          <ListCard title={rideSmart.doTitle} items={rideSmart.dos} tone="do" delay={0} />
          <ListCard title={rideSmart.dontTitle} items={rideSmart.donts} tone="dont" delay={80} />
        </ul>

        <Reveal delay={140}>
          <p className="mx-auto mt-7 max-w-[62ch] text-center text-body-sm text-ink-soft">
            <span aria-hidden="true">🔧</span> {rideSmart.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
