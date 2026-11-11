"use client"

import { useRef, type CSSProperties, type ReactNode } from "react"
import { useScroll, type MotionValue } from "motion/react"
import { cn } from "@/lib/utils"
import { useReducedMotionSafe } from "./use-reduced-motion-safe"

export type ScrollSceneState = {
  /** 0 when the scene pins, 1 when it un-pins */
  progress: MotionValue<number>
  /** reduced motion: render the finished state, nothing is pinned */
  reduced: boolean
}

type ScrollSceneProps = {
  /** total scroll length of the scene, e.g. "320vh" */
  length?: string
  /** turn pinning off (e.g. on small screens); the scene renders as a plain section */
  disabled?: boolean
  className?: string
  pinClassName?: string
  id?: string
  "aria-labelledby"?: string
  children: (state: ScrollSceneState) => ReactNode
}

/**
 * A section that pins its content for `length` of scrolling and hands the
 * scroll progress to its children. With reduced motion or no JavaScript it is
 * an ordinary section of natural height.
 */
export function ScrollScene({
  length = "300vh",
  disabled = false,
  className,
  pinClassName,
  id,
  children,
  ...rest
}: ScrollSceneProps) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotionSafe()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })

  if (disabled) {
    return (
      <section id={id} ref={ref} className={cn("relative", className)} aria-labelledby={rest["aria-labelledby"]}>
        {children({ progress: scrollYProgress, reduced: true })}
      </section>
    )
  }

  return (
    <section
      id={id}
      ref={ref}
      aria-labelledby={rest["aria-labelledby"]}
      className={cn("scroll-scene", className)}
      style={{ "--scene-h": length } as CSSProperties}
    >
      <div className={cn("scroll-scene-pin", pinClassName)}>{children({ progress: scrollYProgress, reduced })}</div>
    </section>
  )
}
