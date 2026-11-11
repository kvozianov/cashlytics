import type { ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { animAttrs, type AnimProps } from "./anim"

type EyebrowProps = AnimProps & {
  children: ReactNode
  /** chapter number, shown as 01, 02… */
  index?: number | string
  as?: ElementType
  className?: string
}

/** Mono label over a heading: `01 — MANAGE`. The dash draws itself. */
export function Eyebrow({ children, index, as: Tag = "p", className, ...anim }: EyebrowProps) {
  const number = typeof index === "number" ? String(index).padStart(2, "0") : index
  return (
    <Tag
      {...animAttrs(anim)}
      className={cn(
        "flex items-center gap-3 font-mono text-[11px] leading-none font-medium tracking-[0.18em] text-muted-foreground uppercase",
        className,
      )}
    >
      {number !== undefined && <span className="text-foreground tabular-nums">{number}</span>}
      <span aria-hidden="true" className="rule-draw h-px w-8 shrink-0 bg-current" />
      <span className="reveal">{children}</span>
    </Tag>
  )
}
