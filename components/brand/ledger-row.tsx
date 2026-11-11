import type { ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { animAttrs, type AnimProps } from "./anim"

type LedgerRowProps = AnimProps & {
  label: ReactNode
  value: ReactNode
  /** small muted line under the label */
  hint?: ReactNode
  tone?: "default" | "positive" | "negative" | "muted" | "signal"
  /** a total line: rule above, heavier figure */
  total?: boolean
  as?: ElementType
  className?: string
  valueClassName?: string
}

const toneClass = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-foreground",
  muted: "text-muted-foreground",
  signal: "text-destructive",
}

/** `Groceries ........ $412.80` — a label, a dotted leader and a mono figure. */
export function LedgerRow({
  label,
  value,
  hint,
  tone = "default",
  total = false,
  as: Tag = "div",
  className,
  valueClassName,
  ...anim
}: LedgerRowProps) {
  return (
    <Tag
      {...animAttrs(anim)}
      className={cn("flex items-baseline gap-2", total && "mt-2 border-t border-current/30 pt-2 font-medium", className)}
    >
      <span className="min-w-0">
        <span className="block">{label}</span>
        {hint && <span className="block text-[0.85em] text-muted-foreground">{hint}</span>}
      </span>
      <span aria-hidden="true" className="ldr-leader" />
      <span className={cn("ldr-value shrink-0 text-right font-mono tabular-nums", toneClass[tone], valueClassName)}>
        {value}
      </span>
    </Tag>
  )
}
