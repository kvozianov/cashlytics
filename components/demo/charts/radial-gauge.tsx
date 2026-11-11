import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { toneVar, type ChartTone } from './sparkline'

export interface RadialGaugeProps {
  value: number
  min?: number
  max?: number
  /** `auto` colours by thirds of the scale: poor (signal), fair (warning), good (success). */
  tone?: ChartTone | 'auto'
  /** Centre content; defaults to the value. */
  children?: ReactNode
  /** Accessible name, e.g. "Financial health 58 out of 100". Without it the dial is decorative (name the parent instead). */
  label?: string
  /** Show the 0 / max labels and tick marks. Default true. */
  ticks?: boolean
  className?: string
}

const SWEEP = 270
const R = 42
const CIRC = 2 * Math.PI * R
const ARC = (CIRC * SWEEP) / 360

export function gaugeTone(ratio: number): ChartTone {
  return ratio >= 0.7 ? 'success' : ratio >= 0.45 ? 'warning' : 'signal'
}

/** A 270° dial. Size it with `className` (it is square). */
export function RadialGauge({ value, min = 0, max = 100, tone = 'auto', children, label, ticks = true, className }: RadialGaugeProps) {
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min || 1)))
  const color = toneVar[tone === 'auto' ? gaugeTone(ratio) : tone]
  const tickAngles = Array.from({ length: 11 }, (_, i) => 135 + (i * SWEEP) / 10)
  return (
    <div
      {...(label ? { role: 'meter', 'aria-label': label, 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuenow': Math.round(value) } : { 'aria-hidden': true })}
      className={cn('relative aspect-square w-40', className)}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <g transform="rotate(135 50 50)">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth={5} strokeDasharray={`${ARC} ${CIRC}`} strokeLinecap="butt" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeDasharray={`${ARC * ratio} ${CIRC}`}
            strokeLinecap="butt"
            className="transition-[stroke-dasharray,stroke] duration-700 ease-out motion-reduce:transition-none"
          />
        </g>
        {ticks &&
          tickAngles.map((a, i) => {
            const rad = (a * Math.PI) / 180
            const r1 = R - 6
            const r2 = i % 5 === 0 ? R - 10 : R - 8
            return (
              <line
                key={i}
                x1={50 + r1 * Math.cos(rad)}
                y1={50 + r1 * Math.sin(rad)}
                x2={50 + r2 * Math.cos(rad)}
                y2={50 + r2 * Math.sin(rad)}
                stroke="var(--muted-foreground)"
                strokeWidth={i % 5 === 0 ? 0.9 : 0.5}
              />
            )
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children ?? <span className="font-mono text-3xl tabular-nums">{Math.round(value)}</span>}</div>
      {ticks && (
        <>
          <span aria-hidden="true" className="absolute bottom-[6%] left-[17%] font-mono text-[10px] text-muted-foreground">
            {min}
          </span>
          <span aria-hidden="true" className="absolute right-[15%] bottom-[6%] font-mono text-[10px] text-muted-foreground">
            {max}
          </span>
        </>
      )}
    </div>
  )
}
