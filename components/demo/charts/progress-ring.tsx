import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { toneVar, type ChartTone } from './sparkline'

export interface ProgressRingProps {
  /** 0..1; values above 1 draw a full ring. */
  value: number
  tone?: ChartTone
  /** Stroke width in viewBox units (box is 36). Default 3.5. */
  thickness?: number
  /** Accessible name, e.g. "Tax reserve 42% covered". Without it the ring is decorative. */
  label?: string
  /** Centre content. */
  children?: ReactNode
  className?: string
}

const R = 15.5
const CIRC = 2 * Math.PI * R

/** A full-circle progress ring. Size it with `className` (default 40px). */
export function ProgressRing({ value, tone = 'ink', thickness = 3.5, label, children, className }: ProgressRingProps) {
  const ratio = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('relative inline-flex size-10 shrink-0 items-center justify-center', className)}
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={R} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          stroke={toneVar[tone]}
          strokeWidth={thickness}
          strokeDasharray={`${ratio * CIRC} ${CIRC}`}
          className="transition-[stroke-dasharray] duration-500 ease-out motion-reduce:transition-none"
        />
      </svg>
      {children && <span className="relative font-mono text-[11px] tabular-nums">{children}</span>}
    </span>
  )
}
