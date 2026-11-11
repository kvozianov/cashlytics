"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import { useFinePointer, useReducedMotionSafe } from "./use-reduced-motion-safe"

type TiltProps = {
  children: ReactNode
  /** maximum tilt in degrees */
  max?: number
  /** lift towards the viewer on hover, in px */
  lift?: number
  className?: string
}

/** Tilts its child in 3D towards the pointer, like a card picked up off a desk. */
export function Tilt({ children, max = 8, lift = 18, className }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotionSafe()
  const fine = useFinePointer()
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const hover = useMotionValue(0)
  const spring = { stiffness: 220, damping: 20, mass: 0.5 }
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), spring)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), spring)
  const z = useSpring(useTransform(hover, [0, 1], [0, lift]), spring)
  const active = fine && !reduced

  return (
    <div className={cn("[perspective:1100px]", className)}>
      <motion.div
        ref={ref}
        className="h-full [transform-style:preserve-3d]"
        style={active ? { rotateX, rotateY, z } : undefined}
        onPointerMove={(e) => {
          if (!active || !ref.current) return
          const r = ref.current.getBoundingClientRect()
          px.set((e.clientX - r.left) / r.width - 0.5)
          py.set((e.clientY - r.top) / r.height - 0.5)
          hover.set(1)
        }}
        onPointerLeave={() => {
          px.set(0)
          py.set(0)
          hover.set(0)
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
