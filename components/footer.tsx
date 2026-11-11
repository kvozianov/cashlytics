import Link from "next/link"
import { LogoMark } from "./logo"

export const GITHUB_URL = "https://github.com/kvozianov/cashlytics"

type FooterLink = { name: string; href: string; external?: boolean; note: string }

const links: FooterLink[] = [
  { name: "Live demo", href: "/demo", note: "/demo" },
  { name: "Services", href: "/services", note: "/services" },
  { name: "Pricing", href: "/pricing", note: "planned" },
  { name: "About", href: "/about", note: "the story" },
  { name: "How the demo works", href: "/demo/about", note: "/demo/about" },
  { name: "GitHub", href: GITHUB_URL, external: true, note: "source ↗" },
]

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative overflow-hidden border-t-2 border-foreground bg-background">
      <div className="mx-auto max-w-[1440px] px-5 pt-14 sm:px-8 lg:px-12 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <LogoMark className="h-9 w-9" />
              <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Manage · Plan · Learn
              </p>
            </div>
            <p className="mt-6 max-w-md font-display text-2xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance">
              A concept for one place to track money, estimate tax as you earn and find the weak points in your
              financial strategy.
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              Concept prototype, not a financial service. All demo data is fictional and stays in your browser. Tax
              figures are illustrative, not tax advice.
            </p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-6 lg:col-start-7">
            <p className="border-b-2 border-foreground pb-2 font-mono text-[10.5px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Index
            </p>
            <ul>
              {links.map((link, i) => {
                const inner = (
                  <>
                    <span className="w-7 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-lg font-semibold tracking-[-0.01em] sm:text-xl">{link.name}</span>
                    <span aria-hidden="true" className="mx-2 min-w-6 flex-1 translate-y-[-0.35em] border-b-[1.5px] border-dotted border-current opacity-35" />
                    <span className="shrink-0 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase transition-colors group-hover:text-foreground">
                      {link.note}
                    </span>
                  </>
                )
                const cls =
                  "group flex items-baseline border-b border-border py-3 transition-[padding] duration-200 hover:pl-2 hover:bg-[linear-gradient(var(--lime),var(--lime))] hover:bg-[length:100%_100%] hover:text-ink"
                return (
                  <li key={link.name}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noreferrer" className={cls}>
                        {inner}
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link href={link.href} className={cls}>
                        {inner}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase sm:flex-row sm:justify-between">
          <p>&copy; {year} Cashlytics · Prototype by Kirill Vozianov</p>
          <p>1st place · TeenMBA final 2026</p>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="pointer-events-none mt-4 -mb-[0.26em] px-2 text-center font-display text-[23.5vw] leading-[0.8] font-extrabold tracking-[-0.065em] whitespace-nowrap text-foreground select-none"
      >
        Cashlytics
      </p>
    </footer>
  )
}
