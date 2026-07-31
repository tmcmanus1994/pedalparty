import { FacebookIcon, InstagramIcon, LogoMark, MailIcon } from "./Icons";
import { footer, nav, site } from "@/lib/content";

const SOCIAL_LINKS = [
  { href: site.instagram, label: "Instagram", Icon: InstagramIcon, external: true },
  { href: site.facebook, label: "Facebook", Icon: FacebookIcon, external: true },
  { href: `mailto:${site.email}`, label: "Email", Icon: MailIcon, external: false },
];

export default function SiteFooter() {
  return (
    <footer className="bg-purple text-white">
      <div className="shell flex flex-col items-center gap-7 py-14 text-center">
        <LogoMark className="h-14 w-14" />

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-[0.98rem] font-bold text-white/90 underline-offset-4 hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="flex items-center gap-3">
          {SOCIAL_LINKS.map(({ href, label, Icon, external }) => (
            <li key={label}>
              <a
                href={href}
                aria-label={label}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer noopener" : undefined}
                className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-ink bg-paper text-ink shadow-[var(--card-shadow-xs)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                <Icon className="h-5 w-5" />
              </a>
            </li>
          ))}
        </ul>

        <p className="max-w-[52ch] text-balance text-body-sm text-white/80">{footer.line}</p>
      </div>
    </footer>
  );
}
