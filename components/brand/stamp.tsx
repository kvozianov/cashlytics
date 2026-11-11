import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { animAttrs, type AnimProps } from "./anim"

type StampProps = AnimProps & {
  /** first line, set larger */
  children: ReactNode
  /** second line, same weight, regular size */
  subline?: ReactNode
  /** optional small third line */
  note?: ReactNode
  tone?: "signal" | "ink" | "success"
  /** degrees; kept within ±4 so the words stay easy to read */
  rotate?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const toneClass = {
  signal: "text-stamp",
  ink: "text-foreground",
  success: "text-success",
}

// Mono caps never drop below 12px; the outline gives the double border.
const sizeClass = {
  sm: "gap-0.5 px-2.5 py-1.5 text-[12px] tracking-[0.14em] border-2 outline-[1.5px] -outline-offset-[5px]",
  md: "gap-1 px-4 py-2.5 text-[12.5px] tracking-[0.16em] border-2 outline-[1.5px] -outline-offset-[6px] sm:text-[14px]",
  lg: "gap-1 px-5 py-3 text-[13px] tracking-[0.16em] border-[2.5px] outline-2 -outline-offset-[7px] sm:text-[15px]",
}

/**
 * A rubber stamp: a rectangular double border with one to three straight
 * lines of mono caps. Solid ink on an opaque ground, a light speckle at most.
 * Thunks onto the page when it comes into view.
 */
export function Stamp({
  children,
  subline,
  note,
  tone = "signal",
  rotate = -3,
  size = "md",
  className,
  ...anim
}: StampProps) {
  const r = Math.max(-4, Math.min(4, rotate))
  return (
    <span
      {...animAttrs(anim, { "--r": `${r}deg` } as CSSProperties)}
      className={cn(
        "stamp inline-flex flex-col items-center justify-center rounded-[3px] border-current bg-background text-center font-mono leading-[1.15] font-medium whitespace-nowrap uppercase outline-solid outline-current select-none",
        toneClass[tone],
        sizeClass[size],
        className,
      )}
    >
      <span className={cn(subline && "text-[1.3em] leading-none font-medium tracking-[0.12em]")}>{children}</span>
      {subline && <span>{subline}</span>}
      {note && <span className="text-[max(12px,0.8em)] tracking-[0.1em]">{note}</span>}
    </span>
  )
}
