"use client"

import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { motion, useTransform, type MotionValue } from "motion/react"
import { Eyebrow } from "@/components/brand"
import { RevealLines } from "@/components/motion/reveal-lines"
import { ScrollScene } from "@/components/motion/scroll-scene"
import { useMediaQuery } from "@/components/motion/use-reduced-motion-safe"
import { cn } from "@/lib/utils"

export type ChapterCopy = {
  index: number
  name: string
  titleLines: ReactNode[]
  body: string
  example: string
  href: string
  cta: string
}

/** Chapter text block: eyebrow, headline, body, a worked example and a link into the demo. */
export function ChapterText({ copy, titleId }: { copy: ChapterCopy; titleId: string }) {
  return (
    <div className="relative">
      <Eyebrow index={copy.index}>{copy.name}</Eyebrow>
      <RevealLines
        id={titleId}
        className="mt-5 font-display text-[clamp(2.1rem,4.2vw,4rem)] leading-[0.98] font-bold tracking-[-0.035em] text-balance"
        lines={copy.titleLines}
      />
      <p data-animate="" className="reveal mt-6 max-w-[34rem] leading-relaxed text-pretty text-muted-foreground lg:text-[1.0625rem]">
        {copy.body}
      </p>
      <div data-animate="" className="reveal mt-6 max-w-[34rem] border-l-2 border-foreground pl-4" style={{ "--d": "120ms" } as CSSProperties}>
        <p className="font-mono text-[10.5px] font-medium tracking-[0.16em] text-muted-foreground uppercase">For example</p>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-foreground">{copy.example}</p>
      </div>
      <Link
        href={copy.href}
        className="group mt-7 inline-flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.14em] uppercase"
      >
        <span className="mk mk-underline mk-lime [--pre:1] group-hover:[--pre:0] group-focus-visible:[--pre:0]">{copy.cta}</span>
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1">
          ↗
        </span>
      </Link>
    </div>
  )
}

/** A giant chapter number that drifts while its chapter is pinned. */
export function Numeral({ n, progress, className }: { n: number; progress?: MotionValue<number>; className?: string }) {
  const fallback = useTransform(() => 0)
  const y = useTransform(progress ?? fallback, [0, 1], ["6vh", "-10vh"])
  return (
    <motion.span
      aria-hidden="true"
      style={progress ? { y } : undefined}
      className={cn(
        "pointer-events-none block font-display text-[clamp(8rem,24vw,22rem)] leading-[0.74] font-extrabold tracking-[-0.07em] text-foreground select-none",
        className,
      )}
    >
      {String(n).padStart(2, "0")}
    </motion.span>
  )
}

type PinnedChapterProps = {
  id: string
  copy: ChapterCopy
  /** total scroll length while pinned on large screens */
  length: string
  /** scroll length of the stage alone on small screens */
  mobileLength: string
  /** which side the numeral and text sit on */
  side?: "left" | "right"
  stage: (progress: MotionValue<number>, reduced: boolean) => ReactNode
  stageClassName?: string
}

/**
 * A chapter that pins while its stage plays out. Large screens pin text and
 * stage side by side; small screens show the text first, then pin the stage.
 */
export function PinnedChapter({ id, copy, length, mobileLength, side = "left", stage, stageClassName }: PinnedChapterProps) {
  const lg = useMediaQuery("(min-width: 1024px)", false)
  const titleId = `${id}-title`

  if (lg) {
    return (
      <ScrollScene id={id} aria-labelledby={titleId} length={length} className="border-t border-border">
        {({ progress, reduced }) => (
          <div className="relative mx-auto grid h-full max-w-[1440px] grid-cols-12 items-center gap-6 px-12">
            <div className={cn("relative z-10 col-span-5", side === "right" && "order-2 col-start-8")}>
              <Numeral n={copy.index} progress={reduced ? undefined : progress} className="-mb-[0.06em] -ml-[0.04em]" />
              <ChapterText copy={copy} titleId={titleId} />
            </div>
            <div
              className={cn(
                "relative col-span-7 h-[78svh] min-h-[460px]",
                side === "right" && "order-1 col-start-1",
                stageClassName,
              )}
            >
              {stage(progress, reduced)}
            </div>
          </div>
        )}
      </ScrollScene>
    )
  }

  return (
    <section id={id} aria-labelledby={titleId} className="border-t border-border">
      <div className="mx-auto max-w-[1440px] px-5 pt-16 sm:px-8">
        <Numeral n={copy.index} className="-mb-[0.04em]" />
        <ChapterText copy={copy} titleId={titleId} />
      </div>
      <ScrollScene length={mobileLength}>
        {({ progress, reduced }) => (
          <div className={cn("relative mx-auto h-full max-w-[720px] px-5 py-14 sm:px-8", stageClassName)}>
            {stage(progress, reduced)}
          </div>
        )}
      </ScrollScene>
    </section>
  )
}
