import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { animAttrs, type AnimProps } from "./anim"

type CircledProps = AnimProps & {
  children: ReactNode
  color?: "signal" | "ink" | "lime" | "success"
  /** stroke width in viewBox units */
  weight?: number
  className?: string
}

const stroke: Record<NonNullable<CircledProps["color"]>, string> = {
  signal: "stroke-signal",
  ink: "stroke-foreground",
  lime: "stroke-lime",
  success: "stroke-success",
}

/** A hand-drawn loop around a figure or a word. */
export function Circled({ children, color = "signal", weight = 2.6, className, ...anim }: CircledProps) {
  return (
    <span {...animAttrs(anim, { "--dur": "900ms" } as CSSProperties)} className={cn("relative inline-block", className)}>
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 60"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -inset-x-[11%] -inset-y-[28%] h-[156%] w-[122%] overflow-visible"
      >
        <path
          d="M97 8C74 0 27 3 11 17-4 30 8 51 46 55c38 5 71-7 69-25-2-16-27-24-57-23-16 1-28 4-35 8"
          pathLength={1}
          fill="none"
          strokeWidth={weight}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("draw", stroke[color])}
        />
      </svg>
    </span>
  )
}
