/**
 * Hero backdrop.
 *
 * ⚠️ The real riverfront/Junction Bridge photo is NOT in the handoff zip — every
 * `arvib8iyzXyv1UL2qgkJNxQDwhU*.jpg` in the Framer export (including the file
 * labelled `hero-riverfront.jpg`) is Framer's stock placeholder of a kitchen.
 * Rather than ship a stock photo as Little Rock, this renders a poster-style
 * golden-hour illustration in the brand palette.
 *
 * Composition note: the SVG is cropped with `slice`, so on a phone only the
 * middle ~430 viewBox units survive. The sun, the bridge lift towers and two
 * riders all sit inside x 510–930 so the scene still reads on mobile.
 *
 * TO SWAP IN THE REAL PHOTO: drop the responsive files into /public/images and
 * set HERO_PHOTO below. Nothing else changes — Hero.tsx already handles both.
 */
export const HERO_PHOTO: {
  /** Base name of the files in /public/images, minus the `-<width>.jpg` suffix. */
  base: string;
  widths: number[];
  alt: string;
} | null = null;

function Cyclist({
  x,
  y,
  scale = 1,
  color = "#050109",
}: {
  x: number;
  y: number;
  scale?: number;
  color?: string;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="none"
      stroke={color}
      strokeWidth={3.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="0" cy="0" r="11" />
      <circle cx="34" cy="0" r="11" />
      <path d="M0 0 14 -14 27 -14M14 -14 22 0h12M27 -14l-5-6M22 0l-8-8" />
      <path d="M22 -16l4-13 8 4" />
      <circle cx="27.5" cy="-33" r="5.5" fill={color} />
    </g>
  );
}

export default function HeroPoster() {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 -z-20 h-full w-full"
      role="img"
      aria-label="Illustration of cyclists rolling along the Arkansas River at golden hour, with the Junction Bridge and the Little Rock skyline behind them"
    >
      <defs>
        <linearGradient id="pp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e0320" />
          <stop offset="26%" stopColor="#280751" />
          <stop offset="52%" stopColor="#4d0f5f" />
          <stop offset="74%" stopColor="#8a2450" />
          <stop offset="90%" stopColor="#b8483a" />
          <stop offset="100%" stopColor="#d4713c" />
        </linearGradient>
        <linearGradient id="pp-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9c5540" />
          <stop offset="30%" stopColor="#5d1c4b" />
          <stop offset="100%" stopColor="#1a0630" />
        </linearGradient>
        <linearGradient id="pp-bank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b0435" />
          <stop offset="100%" stopColor="#0a0117" />
        </linearGradient>
        <radialGradient id="pp-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffb84d" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffb84d" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sky + sun */}
      <rect width="1440" height="662" fill="url(#pp-sky)" />
      <circle cx="760" cy="604" r="230" fill="url(#pp-glow)" />
      <circle cx="760" cy="604" r="78" fill="#e8a14a" opacity="0.85" />

      {/* far skyline */}
      <g fill="#2c0850" opacity="0.7">
        <rect x="30" y="470" width="70" height="192" />
        <rect x="150" y="500" width="54" height="162" />
        <rect x="1230" y="486" width="66" height="176" />
        <rect x="1330" y="516" width="80" height="146" />
      </g>

      {/* near skyline */}
      <g fill="#14032a">
        <rect x="76" y="404" width="66" height="258" />
        <rect x="152" y="452" width="48" height="210" />
        <rect x="210" y="352" width="78" height="310" />
        <path d="M210 352h78l-39-42z" />
        <rect x="244" y="292" width="10" height="26" />
        <rect x="300" y="424" width="56" height="238" />
        <rect x="366" y="466" width="90" height="196" />
        <rect x="466" y="378" width="60" height="284" />
        <rect x="488" y="318" width="12" height="60" />
        <rect x="1090" y="440" width="72" height="222" />
        <rect x="1174" y="482" width="50" height="180" />
        <rect x="1240" y="410" width="76" height="252" />
        <rect x="1330" y="470" width="80" height="192" />
      </g>

      {/* Junction Bridge — deck, truss, lift towers, piers */}
      <g stroke="#0b0117" strokeWidth="7" fill="none" strokeLinecap="square">
        <path d="M180 496h1120M180 528h1120" />
        <path d="M180 528 220 496 260 528 300 496 340 528 380 496 420 528 460 496 500 528 540 496 580 528 620 496 660 528 700 496 740 528 780 496 820 528 860 496 900 528 940 496 980 528 1020 496 1060 528 1100 496 1140 528 1180 496 1220 528 1260 496 1300 528" />
        <path d="M646 496V366M874 496V366M646 366h228M646 410h228" />
        <path d="M676 496V380M844 496V380" />
        <path d="M300 528v134M646 528v134M874 528v134M1180 528v134" />
      </g>

      {/* river */}
      <rect y="662" width="1440" height="150" fill="url(#pp-river)" />
      <g stroke="#e8a878" strokeLinecap="round" opacity="0.32">
        <path d="M690 690h150" strokeWidth="5" />
        <path d="M660 716h215" strokeWidth="4" />
        <path d="M700 742h135" strokeWidth="4" />
        <path d="M640 768h250" strokeWidth="3" />
      </g>
      <g stroke="#c79a7a" strokeWidth="3" strokeLinecap="round" opacity="0.18">
        <path d="M110 700h180M260 734h150M70 768h150M980 706h170M1120 744h190M1010 776h150" />
      </g>

      {/* near bank + riverfront path */}
      <path d="M0 792c230-22 430-10 720 8s500 20 720 2v98H0z" fill="url(#pp-bank)" />
      <path
        d="M0 832c230-22 430-10 720 8s500 20 720 2"
        stroke="#7a5238"
        strokeWidth="22"
        fill="none"
        opacity="0.65"
        strokeLinecap="round"
      />

      {/* riders — two sit dead centre so they survive the mobile crop */}
      <Cyclist x={150} y={840} scale={1.45} />
      <Cyclist x={370} y={848} scale={1.3} />
      <Cyclist x={600} y={858} scale={1.6} />
      <Cyclist x={806} y={862} scale={1.45} />
      <Cyclist x={1060} y={862} scale={1.35} />
      <Cyclist x={1268} y={856} scale={1.2} />
    </svg>
  );
}
