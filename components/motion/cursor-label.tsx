"use client"

import { useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"
import { useFinePointer, useReducedMotionSafe } from "./use-reduced-motion-safe"

type CursorLabelProps = {
  label: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Shows a small ink label that trails the pointer while it is over the child.
 * Decorative: the child keeps its own accessible name. Mouse only.
 */
export function CursorLabel({ label, children, className }: CursorLabelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotionSafe()
  const [shown, setShown] = useState(false)
  const x = useSpring(useMotionValue(0), { stiffness: 500, damping: 40, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 500, damping: 40, mass: 0.4 })

  return (
    <div
      ref={ref}
      className={cn("relative", fine && "cursor-none", className)}
      onPointerEnter={(e) => {
        if (!fine || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        x.jump(e.clientX - r.left)
        y.jump(e.clientY - r.top)
        setShown(true)
      }}
      onPointerMove={(e) => {
        if (!fine || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        x.set(e.clientX - r.left)
        y.set(e.clientY - r.top)
      }}
      onPointerLeave={() => setShown(false)}
    >
      {children}
      <AnimatePresence>
        {shown && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 z-30 whitespace-nowrap rounded-[3px] bg-primary px-3 py-2 font-mono text-xs tracking-wide text-primary-foreground uppercase shadow-[3px_3px_0_0_var(--lime)]"
            style={{ x, y, translateX: "-50%", translateY: "-50%" }}
            initial={reduced ? false : { scale: 0.4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: -3 }}
            exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 520, damping: 26 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
