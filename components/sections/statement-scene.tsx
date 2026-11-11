"use client"

import { useRef, useState, type CSSProperties, type ReactNode } from "react"
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react"
import { Circled, Eyebrow, MarginNote, Marker, Odometer, Stamp } from "@/components/brand"
import { RevealLines } from "@/components/motion/reveal-lines"
import { ScrollScene } from "@/components/motion/scroll-scene"
import { useMediaQuery, useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe"
import { cn } from "@/lib/utils"

// One fictional month, chosen so the sums are easy to check:
// out = 1,435.00, in = 2,400.00, set-aside at an illustrative 20% = 480.00.
type Row = {
  date: string
  raw: string
  amount: number
  category: string
  color: string
  why: string
  review?: boolean
  duplicate?: boolean
  income?: boolean
}

const rows: Row[] = [
  { date: "03 NOV", raw: "NORTHWIND STUDIO INV-014", amount: 2400, category: "Client income", color: "var(--cat-3)", why: "invoice INV-014 paid", income: true },
  { date: "03 NOV", raw: "SQ *BLUE BOTTLE 0423", amount: -5.4, category: "Eating out", color: "var(--cat-2)", why: "matched “blue bottle”" },
  { date: "04 NOV", raw: "ADOBE *CREATIVE CLOUD", amount: -59.99, category: "Software", color: "var(--cat-1)", why: "matched “adobe”" },
  { date: "05 NOV", raw: "WHOLEFDS MKT #10234", amount: -86.31, category: "Groceries", color: "var(--cat-6)", why: "matched “wholefds”" },
  { date: "06 NOV", raw: "NETFLIX.COM 866-579", amount: -15.49, category: "Subscriptions", color: "var(--cat-8)", why: "recurring, monthly" },
  { date: "07 NOV", raw: "UBER *TRIP 8HJ2K", amount: -18.2, category: "Transport", color: "var(--cat-7)", why: "matched “uber *trip”" },
  { date: "08 NOV", raw: "LANDLORD RENT NOV", amount: -1150, category: "Rent", color: "var(--cat-5)", why: "your rule: “landlord”" },
  { date: "09 NOV", raw: "NFLX DIGITAL 2 SVC", amount: -15.49, category: "Subscriptions", color: "var(--cat-8)", why: "same merchant, second plan", duplicate: true },
  { date: "10 NOV", raw: "AMZN MKTP US*2K4L1", amount: -84.12, category: "Needs review", color: "var(--warning)", why: "low confidence, 2 suggestions", review: true },
]

const moneyIn = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0)
const moneyOut = rows.filter((r) => r.amount < 0).reduce((s, r) => s - r.amount, 0)

const steps = [
  { title: "A raw month", body: "Cryptic descriptions, no categories, no totals. Most bank exports look like this." },
  { title: "Filed automatically", body: "A rule-based categoriser files each line and shows the rule it used. The one it is unsure about waits for review instead of being guessed." },
  { title: "Totalled", body: "Money in and money out, by category and by month, from the same lines." },
  { title: "Weak spots, marked", body: "Recurring charges are detected, so a subscription you pay for twice stands out." },
  { title: "Tax, put aside as you earn", body: "Each payment comes with a suggested amount to set aside. Illustrative rates, not tax advice." },
  { title: "One score, and what to fix", body: "A 0–100 health score with the weak points behind it, each with one next step and a two-minute lesson." },
]

const thresholds = [0.1, 0.24, 0.4, 0.56, 0.72]

function stageFor(p: number) {
  let s = 0
  for (const t of thresholds) if (p >= t) s++
  return s
}

function usd(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))
}

/**
 * Large screens: the statement pins and is annotated as you scroll.
 * Small screens: it stays in the page flow, the step caption sticks to the
 * top, and the annotations follow the statement's own pass through the screen.
 */
export function StatementScene() {
  const lg = useMediaQuery("(min-width: 1024px)", false)
  const reduced = useReducedMotionSafe()
  if (!lg) {
    return (
      <section id="statement" aria-labelledby="statement-title" className="border-t border-border pt-14 pb-24">
        <Scene reduced={reduced} />
      </section>
    )
  }
  return (
    <ScrollScene id="statement" aria-labelledby="statement-title" length="460vh" className="border-t border-border">
      {({ progress, reduced }) => <Scene progress={progress} reduced={reduced} />}
    </ScrollScene>
  )
}

function Scene({ progress, reduced }: { progress?: MotionValue<number>; reduced: boolean }) {
  const paperRef = useRef<HTMLDivElement>(null)
  const own = useScroll({ target: paperRef, offset: ["start 0.7", "end 0.75"] })
  const pinned = progress !== undefined
  progress = progress ?? own.scrollYProgress
  const [live, setLive] = useState(0)
  useMotionValueEvent(progress, "change", (p) => {
    const next = stageFor(p)
    if (next !== live) setLive(next)
  })
  const stage = reduced ? steps.length - 1 : live
  const at = (n: number) => stage >= n
  const bar = useTransform(progress, [0, 0.9], [0, 1])

  return (
    <div
      className={cn(
        "mx-auto grid max-w-[1440px] gap-y-6 px-5 sm:px-8 lg:grid-cols-12 lg:gap-x-6 lg:px-12",
        pinned && "h-full grid-rows-[auto_1fr] pt-20 pb-5 lg:grid-rows-1 lg:pt-0",
      )}
    >
      {/* Left: what is happening */}
      <div className="contents lg:col-span-4 lg:flex lg:flex-col lg:justify-center lg:py-24">
        <Eyebrow>The product in one page</Eyebrow>
        <RevealLines
          id="statement-title"
          className="font-display text-[clamp(2rem,4.4vw,4.25rem)] leading-[0.95] font-bold tracking-[-0.035em] md:mt-5"
          lines={["Your statement,", <Marker key="a">annotated.</Marker>]}
        />

        <div className="sticky top-0 z-20 -mx-5 border-b border-border bg-background/95 px-5 py-3 sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0">
          <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span className="tabular-nums text-foreground">
              {String(stage + 1).padStart(2, "0")}
            </span>
            <span className="relative h-px flex-1 bg-border">
              <motion.span
                className="absolute inset-0 origin-left bg-foreground"
                style={reduced ? { scaleX: 1 } : { scaleX: bar }}
              />
            </span>
            <span className="tabular-nums">{String(steps.length).padStart(2, "0")}</span>
          </div>
          <ol className="stack-steps mt-2 space-y-4 lg:mt-5">
            {steps.map((step, i) => (
              <li
                key={step.title}
                data-inview={reduced || i === stage ? "true" : "false"}
                aria-current={i === stage ? "step" : undefined}
                className="reveal"
              >
                <p className="font-display text-base leading-tight font-semibold lg:text-2xl">{step.title}</p>
                <p className="mt-0.5 max-w-sm text-[13px] leading-snug text-pretty text-muted-foreground lg:mt-2 lg:text-base lg:leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Right: the statement itself */}
      <div className="relative flex min-h-0 items-start justify-center pb-20 lg:col-span-8 lg:pb-0 lg:items-center lg:justify-start lg:pl-[4%]">
        <div ref={paperRef} className="paper relative w-full max-w-[640px] px-3.5 py-5 font-mono text-[10.5px] leading-tight text-card-foreground sm:px-6 sm:py-7 sm:text-[12px] lg:max-w-[600px] xl:max-w-[640px]">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-foreground pb-2.5 tracking-[0.14em] uppercase">
            <span className="font-medium">Account statement</span>
            <span className="text-muted-foreground">
              <span className="hidden sm:inline">Nov · ···· 4417 · </span>fictional
            </span>
          </div>

          <ul className="mt-1">
            {rows.map((row, i) => (
              <li key={row.raw} className="relative grid grid-cols-[1fr_auto] items-start gap-x-3 border-b border-border py-2 sm:grid-cols-[3.75rem_1fr_auto]">
                <span className="hidden text-muted-foreground sm:block">{row.date}</span>
                <span className="min-w-0">
                  <span className="block truncate uppercase">
                    {row.duplicate ? (
                      <Marker variant="strike" inView={at(3)}>
                        {row.raw}
                      </Marker>
                    ) : (
                      row.raw
                    )}
                  </span>
                  <span
                    data-inview={at(1) ? "true" : "false"}
                    style={{ "--d": `${i * 55}ms` } as CSSProperties}
                    className="reveal mt-1 flex items-center gap-1.5 truncate text-[0.88em] text-muted-foreground"
                  >
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-[1px]" style={{ background: row.color }} />
                    <span className={cn("font-medium", row.review ? "text-warning" : "text-foreground")}>{row.category}</span>
                    <span className="hidden truncate sm:inline">· {row.why}</span>
                  </span>
                </span>
                <span className={cn("text-right tabular-nums", row.income && "text-success")}>
                  {row.income ? (
                    <Marker inView={at(4)}>+{usd(row.amount)}</Marker>
                  ) : row.duplicate ? (
                    <Marker variant="strike" inView={at(3)} delay={200}>
                      −{usd(row.amount)}
                    </Marker>
                  ) : (
                    `−${usd(row.amount)}`
                  )}
                </span>

                {row.income && (
                  <Note inView={at(4)} className="lg:top-[55%]">
                    set aside <strong className="font-semibold">$480</strong> for tax
                    <span className="block text-[0.8em] opacity-80">20%, illustrative</span>
                  </Note>
                )}
                {row.duplicate && (
                  <Note inView={at(3)} tone="signal" className="lg:top-[40%]">
                    same service, twice: <strong className="font-semibold">$185.88</strong> a year
                  </Note>
                )}
              </li>
            ))}
          </ul>

          <div className="relative mt-3 space-y-1.5 sm:mt-4">
            <div className="flex items-baseline justify-between">
              <span className="tracking-[0.14em] text-muted-foreground uppercase">Money in</span>
              <span data-inview={at(2) ? "true" : "false"} className="reveal tabular-nums text-success">
                +{usd(moneyIn)}
              </span>
            </div>
            <div className="relative flex flex-wrap items-baseline justify-between">
              <span className="tracking-[0.14em] text-muted-foreground uppercase">Money out</span>
              <span data-inview={at(2) ? "true" : "false"} className="reveal text-[1.15em] font-medium tabular-nums">
                <Circled inView={at(2)} delay={250}>
                  −{usd(moneyOut)}
                </Circled>
              </span>
              <Note inView={at(2)} className="lg:top-1/2" delay={600}>
                $1,150 of it is rent
              </Note>
            </div>
          </div>

          {/* Health score lands on the corner of the page */}
          <div
            className="absolute -right-1 -bottom-[4.5rem] flex items-end gap-3 sm:-right-4 lg:-right-8"
            aria-hidden={!at(5)}
          >
            <Stamp inView={at(5)} rotate={-3} size="lg" tone="ink" className="bg-card" subline="2 weak points">
              <span className="flex items-baseline gap-2">
                Health
                <span className="text-[2.2em] leading-none font-medium tracking-normal">
                  <Odometer value={68} inView={at(5)} delay={60} />
                </span>
                /100
              </span>
            </Stamp>
          </div>
        </div>
      </div>
    </div>
  )
}

function Note({
  children,
  inView,
  tone = "ink",
  delay = 150,
  className,
}: {
  children: ReactNode
  inView: boolean
  tone?: "ink" | "signal"
  delay?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        "pointer-events-none z-10 flex basis-full justify-end pt-1.5 max-lg:col-span-full lg:absolute lg:left-full lg:ml-4 lg:block lg:w-52 lg:-translate-y-1/2 lg:pt-0 xl:w-60",
        className,
      )}
    >
      <MarginNote arrow="left" tone={tone} inView={inView} delay={delay} rotate={-3} size="md" className="max-lg:text-[1.05rem]">
        <span>{children}</span>
      </MarginNote>
    </span>
  )
}
