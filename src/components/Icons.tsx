type IconProps = { className?: string };

export function InstagramIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14.3 22v-8.2h2.8l.42-3.24H14.3V8.49c0-.94.26-1.58 1.6-1.58h1.72V4.02A23 23 0 0 0 15.1 3.9c-2.48 0-4.18 1.51-4.18 4.29v2.37H8.1v3.24h2.82V22h3.38Z" />
    </svg>
  );
}

export function MailIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" />
      <path d="m3.5 7 7.36 5.2a2 2 0 0 0 2.28 0L20.5 7" />
    </svg>
  );
}

export function PlusIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
      strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function CrossIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}
      strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Placeholder brand mark — the watercolor rainbow logo from the live site was
 * not included in the handoff assets (the file labelled `logo.png` is the
 * washi-tape texture). Swap in the real artwork when it arrives.
 */
export function LogoMark({ className = "h-10 w-10" }: IconProps) {
  const colors = ["#bc1184", "#e01226", "#e18b12", "#e1c718", "#33b754", "#359fb5"];
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    return {
      key: i,
      color: colors[i % colors.length],
      x2: 24 + 17.5 * Math.cos(angle),
      y2: 24 + 17.5 * Math.sin(angle),
    };
  });

  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Pedal Party">
      <circle cx="24" cy="24" r="21" fill="#fff" stroke="#222" strokeWidth="3" />
      <g strokeWidth="2.8" strokeLinecap="round">
        {spokes.map((s) => (
          <line key={s.key} x1="24" y1="24" x2={s.x2} y2={s.y2} stroke={s.color} />
        ))}
      </g>
      <circle cx="24" cy="24" r="4.5" fill="#5f13a9" stroke="#222" strokeWidth="2.5" />
    </svg>
  );
}
