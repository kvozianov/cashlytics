import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { animAttrs, type AnimProps } from "./anim"

type MarkerProps = AnimProps & {
  children: ReactNode
  /** highlight = lime block behind the words; underline = scribble under them; strike = line through */
  variant?: "highlight" | "underline" | "strike"
  /** colour of an underline (highlight is always lime, strike always vermilion) */
  color?: "lime" | "signal" | "ink"
  className?: string
}

/** A marker stroke drawn behind, under or through some words. Wraps across lines. */
export function Marker({ children, variant = "highlight", color = "lime", className, ...anim }: MarkerProps) {
  return (
    <span
      {...animAttrs(anim)}
      className={cn("mk", `mk-${variant}`, variant === "underline" && `mk-${color}`, className)}
    >
      {children}
    </span>
  )
}
