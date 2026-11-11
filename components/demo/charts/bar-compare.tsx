import { cn } from '@/lib/utils'

import { toneVar, type ChartTone } from './sparkline'

export interface BarCompareItem {
  label: string
  value: number
  tone?: ChartTone
  /** Formatted value; defaults to `format(value)`. */
  display?: string
}

export interface BarCompareProps {
  items: BarCompareItem[]
  /** Scale maximum; defaults to the largest value. */
  max?: number
  format?: (n: number) => string
  className?: string
}

/** Two or three horizontal bars on one scale, labelled directly ("3-month average" vs "October"). */
export function BarCompare({ items, max, format = (n) => String(Math.round(n)), className }: BarCompareProps) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1)
  return (
    <dl className={cn('space-y-1.5', className)}>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[minmax(0,7.5rem)_1fr] items-center gap-3 text-xs">
          <dt className="truncate text-muted-foreground">{item.label}</dt>
          <dd className="flex min-w-0 items-center gap-2">
            <span className="relative h-2.5 min-w-0 flex-1">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[2px] transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${Math.max(1, (Math.max(0, item.value) / top) * 100)}%`, backgroundColor: toneVar[item.tone ?? 'muted'] }}
              />
            </span>
            <span className="w-16 shrink-0 text-right font-mono tabular-nums">{item.display ?? format(item.value)}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
