import Link from "next/link"
import { MarginNote, Receipt, ReceiptRule } from "@/components/brand"
import { cn } from "@/lib/utils"
import type { Plan } from "./plans"

type PlanCardProps = {
  plan: Plan
  /** show only the first four features */
  compact?: boolean
  /** ms before the receipt starts printing */
  delay?: number
  className?: string
}

/** A planned plan, printed as a receipt. Nothing here can be bought. */
export function PlanCard({ plan, compact = false, delay = 0, className }: PlanCardProps) {
  const features = compact ? plan.features.slice(0, 4) : plan.features
  const more = plan.features.length - features.length

  return (
    <div className={cn("relative", className)}>
      {/* the printer slot the receipt comes out of */}
      <div aria-hidden="true" className="relative z-10 mx-[-10px] h-2.5 rounded-[2px] bg-foreground" />
      <Receipt delay={delay} printMs={1300} edge="bottom" className="mx-0 pt-6 text-[12.5px]">
        <div className="flex items-baseline justify-between text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
          <span>Cashlytics</span>
          <span>Plan · {plan.id}</span>
        </div>
        <h3 className="mt-4 font-display text-[2rem] leading-none font-bold tracking-[-0.03em]">{plan.name}</h3>
        <p className="mt-2 font-sans text-sm text-muted-foreground">{plan.audience}</p>
        <ReceiptRule className="mt-4" />
        <p className="flex items-baseline justify-between gap-3">
          <span className="text-[2.25rem] leading-none font-medium tracking-[-0.04em] tabular-nums">${plan.price}</span>
          <span className="text-right text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            / month
            <br />
            planned
          </span>
        </p>
        <ReceiptRule />
        <ul className="space-y-1.5">
          {features.map((feature) => (
            <li key={feature.name} className="flex items-baseline gap-2">
              <span className={cn("min-w-0", feature.status === "planned" && "text-muted-foreground")}>{feature.name}</span>
              <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-0.3em] border-b-[1.5px] border-dotted border-current opacity-40" />
              <span
                className={cn(
                  "shrink-0 text-[10.5px] tracking-[0.1em] uppercase",
                  feature.status === "demo" ? "text-success" : "text-muted-foreground",
                )}
              >
                {feature.status === "demo" ? "In demo" : "Planned"}
              </span>
            </li>
          ))}
          {more > 0 && <li className="text-muted-foreground">+ {more} more on the pricing page</li>}
        </ul>
        <ReceiptRule />
        <p className="flex items-baseline justify-between font-medium">
          <span className="tracking-[0.12em] uppercase">Due today</span>
          <span className="tabular-nums">$0.00</span>
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">Nothing is charged anywhere on this site.</p>
        <Link
          href="/demo"
          className="mt-5 flex h-11 items-center justify-center gap-2 rounded-[3px] border-[1.5px] border-foreground font-sans text-sm font-semibold transition-colors duration-150 hover:bg-foreground hover:text-background"
        >
          Try the demo <span aria-hidden="true">→</span>
        </Link>
        <div aria-hidden="true" className="mt-5 h-8 bg-[repeating-linear-gradient(90deg,currentColor_0_2px,transparent_2px_4px,currentColor_4px_5px,transparent_5px_8px,currentColor_8px_11px,transparent_11px_12px)] opacity-80" />
      </Receipt>
      {plan.highlight && (
        <MarginNote arrow="down" tone="signal" rotate={-6} delay={delay + 1300} className="absolute -top-16 right-2 sm:-right-4">
          {plan.highlight.toLowerCase()}
        </MarginNote>
      )}
    </div>
  )
}
