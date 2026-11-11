"use client"

import { useState } from "react"
import { useMotionValueEvent, useTransform, type MotionValue } from "motion/react"
import { LedgerRow, MarginNote, Odometer } from "@/components/brand"
import { PinnedChapter, type ChapterCopy } from "./chapter"
import { TaxJar } from "./scenes"

const copy: ChapterCopy = {
  index: 2,
  name: "Plan",
  titleLines: ["Budgets, goals and", "the tax you will owe,", "kept up to date."],
  body: "Monthly budgets per category, savings goals with a pace, and a tax estimate that moves every time money comes in. Everything reads from the same transactions, so nothing has to be typed twice.",
  example: "Mark a $2,400 invoice paid and income, the tax estimate and the suggested set-aside change together.",
  href: "/demo/plan",
  cta: "Open budgets and goals",
}

// Illustrative quarter, the same figures as the overview preview.
const ESTIMATE = 2620
const SET_ASIDE = 2180

export function ChapterPlan() {
  return (
    <PinnedChapter
      id="plan"
      copy={copy}
      side="right"
      length="260vh"
      mobileLength="200vh"
      stage={(progress, reduced) => <Stage progress={progress} reduced={reduced} />}
    />
  )
}

function Stage({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const fill = useTransform(progress, [0.08, 0.82], [0, 1], { clamp: true })
  const [amount, setAmount] = useState(0)
  const [done, setDone] = useState(false)
  useMotionValueEvent(fill, "change", (f) => {
    const next = Math.round((f * SET_ASIDE) / 10) * 10
    if (next !== amount) setAmount(next)
    if (f >= 0.999 !== done) setDone(f >= 0.999)
  })
  const value = reduced ? SET_ASIDE : amount
  const finished = reduced || done

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-y-0 right-0 left-[40%] max-lg:inset-x-0 max-lg:top-[42%] max-lg:left-0">
        <TaxJar progress={fill} />
      </div>

      <div className="relative z-10 w-full max-w-[300px] font-mono text-[12px] lg:mt-[6%]">
        <p className="text-[10.5px] font-medium tracking-[0.18em] text-muted-foreground uppercase">Tax reserve · this quarter</p>
        <p className="mt-2 text-[clamp(2.75rem,5vw,4.5rem)] leading-none font-medium tracking-[-0.04em]">
          <Odometer value={value} format="usd" inView />
        </p>
        <div className="mt-5 space-y-1.5">
          <LedgerRow still label="Estimated tax" value="$2,620" />
          <LedgerRow still label="Set aside" value={`$${value.toLocaleString("en-US")}`} />
          <LedgerRow still total label="Still to put away" value={`$${(ESTIMATE - value).toLocaleString("en-US")}`} />
        </div>
        <p className="mt-3 text-[10px] tracking-[0.08em] text-muted-foreground uppercase">Illustrative figures · not tax advice</p>
        <MarginNote arrow="up" tone="signal" inView={finished} className="mt-3 ml-10">
          $440 short of the estimate
        </MarginNote>
      </div>
    </div>
  )
}
