"use client"

import { useState } from "react"
import { cubicBezier, motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react"
import { PinnedChapter, type ChapterCopy } from "./chapter"

const copy: ChapterCopy = {
  index: 1,
  name: "Manage",
  titleLines: ["Every transaction in one place,", "sorted for you."],
  body: "A rule-based categoriser reads bank-style descriptions and files each one, showing why. When it is unsure, the transaction waits in a review queue instead of being guessed. Correct it once and it becomes your own rule.",
  example: "“SQ *BLUE BOTTLE 0423” becomes Eating out, with the reason next to it: matched “blue bottle”.",
  href: "/demo/transactions",
  cta: "Open transactions",
}

const piles = [
  { label: "Eating out", color: "var(--cat-2)", x: 1 },
  { label: "Subscriptions", color: "var(--cat-8)", x: 35 },
  { label: "Needs review", color: "var(--warning)", x: 69 },
]

// Fictional slips. `pile` is where the rules send each one.
const slips = [
  { raw: "SQ *BLUE BOTTLE 0423", amount: "−5.40", pile: 0, from: [6, 2, -14], why: "matched “blue bottle”" },
  { raw: "NETFLIX.COM 866-579", amount: "−15.49", pile: 1, from: [44, 9, 10], why: "recurring, monthly" },
  { raw: "AMZN MKTP US*2K4L1", amount: "−84.12", pile: 2, from: [70, 1, -7], why: "low confidence, 2 suggestions" },
  { raw: "DOORDASH*THAI GARDEN", amount: "−23.80", pile: 0, from: [18, 25, 12], why: "matched “doordash”" },
  { raw: "SPOTIFY P1A2B3C4", amount: "−11.99", pile: 1, from: [57, 30, -17], why: "recurring, monthly" },
  { raw: "PAYPAL *JS1 4029", amount: "−40.00", pile: 2, from: [78, 21, 6], why: "payee unclear" },
  { raw: "STARBUCKS #2231", amount: "−6.15", pile: 0, from: [2, 41, -6], why: "matched “starbucks”" },
  { raw: "ICLOUD STORAGE 50GB", amount: "−2.99", pile: 1, from: [34, 44, 15], why: "recurring, monthly" },
  { raw: "POS 4471 TERMINAL 2", amount: "−12.00", pile: 2, from: [64, 42, -11], why: "no rule matched" },
] as const

const landsAt = (i: number) => 0.06 + i * 0.072 + 0.2

const ease = cubicBezier(0.7, 0, 0.25, 1)
const PILE_Y = 58

export function ChapterManage() {
  return (
    <PinnedChapter
      id="manage"
      copy={copy}
      length="260vh"
      mobileLength="190vh"
      stage={(progress, reduced) => <Stage progress={progress} reduced={reduced} />}
    />
  )
}

function Stage({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const perPile = [0, 0, 0]
  return (
    <div className="absolute inset-0 [container-type:size]" aria-hidden="true">
      <RuleLog progress={progress} reduced={reduced} />
      {piles.map((pile) => (
        <div
          key={pile.label}
          className="absolute flex w-[30cqw] items-center gap-2 border-t-2 border-foreground pt-2 font-mono text-[10px] font-medium tracking-[0.14em] uppercase sm:text-[11px]"
          style={{ left: `${pile.x}cqw`, top: `calc(${PILE_Y}cqh + 6.5rem)` }}
        >
          <span className="h-2.5 w-2.5 shrink-0" style={{ background: pile.color }} />
          <span className="truncate">{pile.label}</span>
          <span className="ml-auto tabular-nums text-muted-foreground">3</span>
        </div>
      ))}
      {slips.map((slip, i) => {
        const k = perPile[slip.pile]++
        return <Slip key={slip.raw} slip={slip} index={i} stack={k} progress={progress} reduced={reduced} />
      })}
    </div>
  )
}

function Slip({
  slip,
  index,
  stack,
  progress,
  reduced,
}: {
  slip: (typeof slips)[number]
  index: number
  stack: number
  progress: MotionValue<number>
  reduced: boolean
}) {
  const end = landsAt(index)
  const start = end - 0.2
  const pile = piles[slip.pile]
  const toX = pile.x + stack * 0.8
  const toY = PILE_Y - stack * 3.2
  const toR = [-3, 2.5, -1.5][stack]
  const x = useTransform(progress, [start, end], [`${slip.from[0]}cqw`, `${toX}cqw`], { ease })
  const y = useTransform(progress, [start, end], [`${slip.from[1]}cqh`, `${toY}cqh`], { ease })
  const rotate = useTransform(progress, [start, end], [slip.from[2], toR], { ease })
  const lift = useTransform(progress, [start, (start + end) / 2, end], [1, 1.08, 1])
  const tag = useTransform(progress, [end - 0.03, end], [0, 1])

  const style = reduced
    ? { x: `${toX}cqw`, y: `${toY}cqh`, rotate: toR }
    : { x, y, rotate, scale: lift }

  return (
    <motion.div
      className="absolute top-0 left-0 w-[30cqw] max-w-[230px] border border-foreground/70 bg-card px-2.5 py-2 font-mono text-[9.5px] leading-snug shadow-[2px_2px_0_0_var(--foreground)] sm:px-3 sm:text-[11px]"
      style={{ ...style, zIndex: 10 + index }}
    >
      <span className="block truncate uppercase">{slip.raw}</span>
      <span className="mt-1 flex items-baseline justify-between gap-2">
        <motion.span style={reduced ? undefined : { opacity: tag }} className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <span className="h-1.5 w-1.5 shrink-0" style={{ background: pile.color }} />
          <span className="truncate">{pile.label}</span>
        </motion.span>
        <span className="tabular-nums">{slip.amount}</span>
      </span>
    </motion.div>
  )
}

/** The categoriser's log: one line per slip, written as it lands. Fills the space the slips leave behind. */
function RuleLog({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const [filed, setFiled] = useState(0)
  useMotionValueEvent(progress, "change", (p) => {
    const n = slips.filter((_, i) => p >= landsAt(i)).length
    if (n !== filed) setFiled(n)
  })
  const count = reduced ? slips.length : filed
  return (
    <div className="absolute inset-x-0 top-0 h-[44cqh] font-mono text-[10px] leading-[1.9] sm:text-[11px]">
      <div className="flex items-baseline justify-between border-b-2 border-foreground pb-1.5 tracking-[0.16em] text-muted-foreground uppercase">
        <span>Rule log</span>
        <span className="tabular-nums text-foreground">{count} / {slips.length} filed</span>
      </div>
      <ol className="mt-1.5">
        {slips.map((slip, i) => (
          <li
            key={slip.raw}
            data-inview={reduced || i < count ? "true" : "false"}
            className="reveal flex items-baseline gap-2 border-b border-border"
          >
            <span className="w-5 shrink-0 tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0 truncate uppercase">{slip.raw}</span>
            <span className="shrink-0 text-muted-foreground">→</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="h-1.5 w-1.5" style={{ background: piles[slip.pile].color }} />
              {piles[slip.pile].label}
            </span>
            <span className="ml-auto hidden shrink-0 truncate text-muted-foreground sm:inline">{slip.why}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
