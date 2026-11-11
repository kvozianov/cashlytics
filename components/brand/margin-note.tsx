import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { animAttrs, type AnimProps } from "./anim"

type Direction = "left" | "right" | "up" | "down" | "none"

type MarginNoteProps = AnimProps & {
  children: ReactNode
  /** which way the hand-drawn arrow points */
  arrow?: Direction
  tone?: "ink" | "signal" | "muted"
  /** degrees; notes are never quite straight */
  rotate?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const toneClass = {
  ink: "text-foreground",
  signal: "text-stamp",
  muted: "text-muted-foreground",
}

const sizeClass = {
  sm: "text-lg leading-[1.05]",
  md: "text-[1.375rem] leading-[1.05]",
  lg: "text-[1.75rem] leading-[1.02]",
}

function Arrow({ direction }: { direction: Exclude<Direction, "none"> }) {
  const horizontal = direction === "left" || direction === "right"
  const flip =
    direction === "left" ? "-scale-x-100" : direction === "up" ? "-scale-y-100" : ""
  return (
    <svg
      aria-hidden="true"
      viewBox={horizontal ? "0 0 48 24" : "0 0 24 44"}
      className={cn("shrink-0 overflow-visible", horizontal ? "h-[0.9em] w-[1.9em]" : "h-[1.7em] w-[0.95em]", flip)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {horizontal ? (
        <>
          <path className="draw" pathLength={1} d="M2 15C13 5 29 4 44 12" />
          <path className="draw" pathLength={1} d="M36 5.5 45 12.5 36.5 18" style={{ "--d": "calc(var(--ad) + 260ms)" } as CSSProperties} />
        </>
      ) : (
        <>
          <path className="draw" pathLength={1} d="M9 2C1 14 3 28 13 40" />
          <path className="draw" pathLength={1} d="M5.5 33.5 13.5 41 19 32" style={{ "--d": "calc(var(--ad) + 260ms)" } as CSSProperties} />
        </>
      )}
    </svg>
  )
}

/** A handwritten note in the margin, with an arrow pointing at the thing it is about. */
export function MarginNote({
  children,
  arrow = "left",
  tone = "ink",
  rotate = -3,
  size = "md",
  className,
  delay = 0,
  ...anim
}: MarginNoteProps) {
  const vertical = arrow === "up" || arrow === "down"
  const before = arrow === "left" || arrow === "up"
  const arrowDelay = `${delay + 420}ms`
  return (
    <span
      {...animAttrs({ delay, ...anim }, { rotate: `${rotate}deg`, "--ad": arrowDelay } as CSSProperties)}
      className={cn(
        "inline-flex font-hand font-semibold",
        vertical ? "flex-col items-start gap-0.5" : "items-center gap-1.5",
        toneClass[tone],
        sizeClass[size],
        className,
      )}
    >
      {arrow !== "none" && before && (
        <span className="contents [&_.draw]:[--d:var(--ad)]">
          <Arrow direction={arrow} />
        </span>
      )}
      <span className="mnote-text">{children}</span>
      {arrow !== "none" && !before && (
        <span className="contents [&_.draw]:[--d:var(--ad)]">
          <Arrow direction={arrow} />
        </span>
      )}
    </span>
  )
}
