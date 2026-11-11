"use client"

import { useRef, type CSSProperties } from "react"
import { motion, useScroll, useSpring } from "motion/react"
import { MarginNote } from "@/components/brand"
import { useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe"
import { cn } from "@/lib/utils"

export type RoadmapStep = { step: number; title: string; detail: string }

/**
 * The roadmap as a ruled line that draws itself while you scroll past it.
 * Horizontal on large screens, vertical on small ones.
 */
export function RoadmapTimeline({ steps }: { steps: RoadmapStep[] }) {
  const ref = useRef<HTMLOListElement>(null)
  const reduced = useReducedMotionSafe()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.55"] })
  const draw = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <ol ref={ref} className="relative grid gap-0 lg:grid-cols-6 lg:gap-5">
      {/* the line: dashed track, solid ink drawn over it */}
      <span aria-hidden="true" className="absolute top-3 bottom-3 left-[11px] w-0 border-l border-dashed border-foreground/40 lg:top-[11px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-0 lg:w-auto lg:border-t lg:border-l-0" />
      <motion.span
        aria-hidden="true"
        style={reduced ? undefined : { scaleX: draw }}
        className="absolute top-[11px] right-0 left-0 hidden h-[2px] origin-left bg-foreground lg:block"
      />
      <motion.span
        aria-hidden="true"
        style={reduced ? undefined : { scaleY: draw }}
        className="absolute top-3 bottom-3 left-[10.5px] w-[2px] origin-top bg-foreground lg:hidden"
      />

      <li className="relative pb-12 pl-12 lg:pb-0 lg:pl-0">
        <span className="absolute top-0 left-0 flex h-6 w-6 items-center justify-center border-2 border-foreground bg-lime lg:relative">
          <span className="sr-only">Current stage</span>
        </span>
        <div className="relative lg:mt-6">
          <MarginNote arrow="left" tone="signal" rotate={-4} size="lg" delay={300} className="-mt-1 mb-2 -ml-3 lg:hidden">
            you are here
          </MarginNote>
          <MarginNote arrow="up" tone="signal" rotate={-5} size="lg" delay={300} className="-mt-3 mb-2 hidden lg:inline-flex">
            you are here
          </MarginNote>
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Now</p>
          <p className="mt-1 font-display text-xl font-bold tracking-[-0.02em]">Clickable prototype</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">
            This site and an in-browser demo on fictional data.
          </p>
        </div>
      </li>
      {steps.map((item, i) => (
        <li key={item.step} data-animate="" className={cn("reveal relative pl-12 lg:pl-0", i < steps.length - 1 && "pb-12 lg:pb-0")} style={{ "--d": `${i * 90}ms` } as CSSProperties}>
          <span className="absolute top-0 left-0 flex h-6 w-6 items-center justify-center border border-foreground bg-background font-mono text-[11px] tabular-nums lg:relative">
            {item.step}
          </span>
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase lg:mt-6">
            Step {item.step} · not started
          </p>
          <p className="mt-1 font-display text-xl font-bold tracking-[-0.02em]">{item.title}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">{item.detail}</p>
        </li>
      ))}
    </ol>
  )
}
