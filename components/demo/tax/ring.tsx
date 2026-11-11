import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface RingProps {
  /** 0..1; values above 1 draw a full ring. */
  value: number
  size?: number
  stroke?: number
  tone?: 'ink' | 'success' | 'warning' | 'destructive'
  label: string
  children?: ReactNode
  className?: string
}

const toneClass = {
  ink: 'stroke-foreground',
  success: 'stroke-success',
  warning: 'stroke-warning',
  destructive: 'stroke-destructive',
}

/** A thin progress ring with a hairline track; the arc eases when the value changes. */
export function Ring({ value, size = 120, stroke = 6, tone = 'ink', label, children, className }: RingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  return (
    <div className={cn('relative inline-grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={1} className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none', toneClass[tone])}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  )
}
