"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"
import { useFinePointer, useReducedMotionSafe } from "./use-reduced-motion-safe"

type MagneticProps = {
  children: ReactNode
  /** 0–1, how far the child follows the pointer */
  strength?: number
  className?: string
}

/** Pulls its child a little towards the pointer. Mouse only, off for reduced motion. */
export function Magnetic({ children, strength = 0.28, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotionSafe()
  const fine = useFinePointer()
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.6 })
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.6 })
  const active = fine && !reduced

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (!active || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.span>
  )
}
