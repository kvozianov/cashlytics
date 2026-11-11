import { useId } from 'react'

import { cn } from '@/lib/utils'

export type ChartTone = 'ink' | 'success' | 'signal' | 'warning' | 'muted'

export const toneVar: Record<ChartTone, string> = {
  ink: 'var(--foreground)',
  success: 'var(--success)',
  signal: 'var(--destructive)',
  warning: 'var(--warning)',
  muted: 'var(--muted-foreground)',
}

export interface SparklineProps {
  values: number[]
  tone?: ChartTone
  /** Light wash under the line. */
  area?: boolean
  /** Dot on the last point. Default true. */
  showLast?: boolean
  /** Hairline at zero when the series crosses it. */
  zeroLine?: boolean
  /** Accessible description; without it the sparkline is decorative. */
  label?: string
  className?: string
}

/** A tiny trend line. Scales to its box (give it a width and height with `className`). */
export function Sparkline({ values, tone = 'ink', area = false, showLast = true, zeroLine = false, label, className }: SparklineProps) {
  const id = useId()
  const w = 100
  const h = 32
  const pad = 3
  if (values.length < 2) return <span aria-hidden="true" className={cn('block h-8 w-24', className)} />
  const min = Math.min(...values, zeroLine ? 0 : Infinity)
  const max = Math.max(...values, zeroLine ? 0 : -Infinity)
  const span = max - min || 1
  const x = (i: number) => (i / (values.length - 1)) * w
  const y = (v: number) => pad + (1 - (v - min) / span) * (h - pad * 2)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join('')
  const color = toneVar[tone]
  const lastX = x(values.length - 1)
  const lastY = y(values[values.length - 1])
  return (
    <span className={cn('relative block h-8 w-24', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        {zeroLine && min < 0 && max > 0 && (
          <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        )}
        {area && (
          <>
            <defs>
              <linearGradient id={`${id}-a`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={color} stopOpacity={0.14} />
                <stop offset="1" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={`${d}L${w},${h}L0,${h}Z`} fill={`url(#${id}-a)`} />
          </>
        )}
        <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {showLast && (
        <span
          aria-hidden="true"
          className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
          style={{ left: `${(lastX / w) * 100}%`, top: `${(lastY / h) * 100}%`, backgroundColor: color }}
        />
      )}
    </span>
  )
}
