import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

export type TickerItem = {
  /** raw bank description, e.g. "SQ *BLUE BOTTLE 0423" */
  from: string
  /** the category it was filed under */
  to: string
  /** optional amount, already formatted */
  amount?: string
}

type TickerProps = {
  items: TickerItem[]
  /** seconds for one full loop */
  duration?: number
  /** run right-to-left (default) or left-to-right */
  reverse?: boolean
  className?: string
  label?: string
}

function Row({ items, hidden }: { items: TickerItem[]; hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3 px-6 whitespace-nowrap">
          <span className="opacity-85">{item.from}</span>
          {item.amount && <span className="tabular-nums opacity-60">{item.amount}</span>}
          <span aria-hidden="true">→</span>
          <span className="sr-only">filed as</span>
          <span className="rounded-[2px] bg-lime px-1.5 py-0.5 text-ink">{item.to}</span>
          <span aria-hidden="true" className="ml-3 opacity-40">
            ✳
          </span>
        </li>
      ))}
    </ul>
  )
}

/** An endless tape of transactions being filed. Pauses on hover, still for reduced motion. */
export function Ticker({ items, duration = 60, reverse = false, className, label = "Example transactions being categorised" }: TickerProps) {
  return (
    <div
      role="region"
      aria-label={label}
      className={cn("ticker overflow-hidden bg-primary py-3 font-mono text-[12px] tracking-wide text-primary-foreground uppercase", className)}
    >
      <div
        className="ticker-track flex w-max"
        style={{ "--ticker-dur": `${duration}s`, animationDirection: reverse ? "reverse" : undefined } as CSSProperties}
      >
        <Row items={items} />
        <Row items={items} hidden />
      </div>
    </div>
  )
}
