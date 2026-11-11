"use client"

import { useRef, type ReactNode } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { useReducedMotionSafe } from "./use-reduced-motion-safe"

type ParallaxProps = {
  children: ReactNode
  /** px travelled across the element's pass through the viewport; negative moves up faster */
  offset?: number
  /** optional rotation across the same pass, in degrees */
  rotate?: number
  axis?: "y" | "x"
  className?: string
}

/** Moves its child against the scroll while it passes through the viewport. */
export function Parallax({ children, offset = 120, rotate = 0, axis = "y", className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotionSafe()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const move = useTransform(scrollYProgress, [0, 1], [offset / 2, -offset / 2])
  const turn = useTransform(scrollYProgress, [0, 1], [-rotate / 2, rotate / 2])

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduced ? undefined : axis === "y" ? { y: move, rotate: turn } : { x: move, rotate: turn }}
    >
      {children}
    </motion.div>
  )
}
