import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { ReactNode } from 'react'

import { signedPct, signedPoints } from '@/lib/demo/format'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  label: string
  /** Main figure; pass a string or a `<Money />`. */
  value: ReactNode
  /** Change vs the previous period: 0.12 = +12 %; null/undefined hides it. */
  delta?: number | null
  /** `pct` (relative change, default) or `points` (percentage points, for rates). */
  deltaKind?: 'pct' | 'points'
  /** Which direction is good news; for spending pass `down`. */
  goodWhen?: 'up' | 'down'
  /** Small text under the value, e.g. `vs Oct 1–11`. */
  hint?: ReactNode
  className?: string
}

/** KPI tile: label, big mono figure, optional delta and hint. */
export function StatCard({ label, value, delta, deltaKind = 'pct', goodWhen = 'up', hint, className }: StatCardProps) {
  const hasDelta = delta !== null && delta !== undefined && Number.isFinite(delta)
  const flat = hasDelta && Math.abs(delta) < (deltaKind === 'pct' ? 0.005 : 0.005)
  const up = hasDelta && delta > 0
  const good = hasDelta && !flat && (goodWhen === 'up' ? up : !up)
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <div className={cn('flex min-w-0 flex-col gap-2 rounded-md border border-border bg-card p-4', className)}>
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <div className="font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-[1.75rem]">{value}</div>
      {(hasDelta || hint) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {hasDelta && (
            <span className={cn('inline-flex items-center gap-0.5 font-mono tabular-nums', good ? 'text-success' : 'text-foreground')}>
              <Icon aria-hidden="true" className="size-3.5" />
              <span className="sr-only">{flat ? 'No change' : up ? 'Up' : 'Down'}</span>
              {deltaKind === 'points' ? signedPoints(delta) : signedPct(delta)}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  )
}
