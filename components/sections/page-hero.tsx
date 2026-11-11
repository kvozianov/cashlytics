import type { CSSProperties, ReactNode } from "react"
import { RevealLines } from "@/components/motion/reveal-lines"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  /** three short mono labels across the top rule, e.g. ["Services", "Five chapters", "Nº 002"] */
  meta: [string, string, string]
  titleId: string
  titleLines: ReactNode[]
  lede: ReactNode
  /** sits to the right of the lede on large screens (a stamp, a dossier card…) */
  aside?: ReactNode
  className?: string
}

/** Opening block for inner pages: meta rule, a big left-aligned headline, lede and an aside. */
export function PageHero({ meta, titleId, titleLines, lede, aside, className }: PageHeroProps) {
  return (
    <section aria-labelledby={titleId} data-boot-reveal="" className={cn("relative overflow-x-clip pt-20 pb-16 sm:pt-24 lg:pb-24", className)}>
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div
          data-animate=""
          className="reveal flex items-center justify-between gap-4 border-b border-border pb-3 font-mono text-[10.5px] font-medium tracking-[0.18em] text-muted-foreground uppercase sm:text-[11px]"
        >
          <span>{meta[0]}</span>
          <span className="hidden sm:inline">{meta[1]}</span>
          <span className="tabular-nums">{meta[2]}</span>
        </div>
        <RevealLines
          as="h1"
          id={titleId}
          delay={20}
          stagger={80}
          className="mt-8 font-display text-[clamp(2.75rem,7.2vw,7.75rem)] leading-[0.9] font-extrabold tracking-[-0.045em] text-balance sm:mt-10"
          lines={titleLines}
        />
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-12 lg:gap-6">
          <div
            data-animate=""
            style={{ "--d": "300ms" } as CSSProperties}
            className="reveal max-w-[38rem] text-[1.0625rem] leading-relaxed text-pretty text-muted-foreground lg:col-span-6 lg:text-lg"
          >
            {lede}
          </div>
          {aside && <div className="lg:col-span-5 lg:col-start-8">{aside}</div>}
        </div>
      </div>
    </section>
  )
}
