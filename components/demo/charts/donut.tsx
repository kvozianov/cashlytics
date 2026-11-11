'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface DonutSlice {
  key: string
  label: string
  value: number
  color: string
}

export interface DonutProps {
  slices: DonutSlice[]
  /** Highlighted slice (e.g. the row hovered in a list beside it). */
  activeKey?: string | null
  onActiveChange?: (key: string | null) => void
  /** Accessible name; the parts and shares are appended. */
  label: string
  /** Centre content. */
  children?: ReactNode
  className?: string
}

const R = 40
const CIRC = 2 * Math.PI * R
const GAP = 1.4

/**
 * A ring split into parts. Decorative for keyboard users: pair it with a list
 * of the same parts (links or buttons) and pass the hovered key as `activeKey`.
 */
export function Donut({ slices, activeKey, onActiveChange, label, children, className }: DonutProps) {
  const parts = slices.filter((s) => s.value > 0)
  const sum = parts.reduce((s, p) => s + p.value, 0)
  const offsets = parts.reduce<number[]>((acc, p, i) => [...acc, i === 0 ? 0 : acc[i - 1] + (parts[i - 1].value / sum) * CIRC], [])
  const described = `${label}: ${parts.map((p) => `${p.label} ${Math.round((p.value / (sum || 1)) * 100)}%`).join(', ')}`
  return (
    <div role="img" aria-label={described} className={cn('relative aspect-square w-40', className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" onMouseLeave={() => onActiveChange?.(null)}>
        {sum <= 0 && <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth={10} />}
        {parts.map((p, i) => {
          const len = (p.value / sum) * CIRC
          const dash = Math.max(0.01, len - (parts.length > 1 ? GAP : 0))
          const active = activeKey === p.key
          const dim = activeKey != null && !active
          return (
            <circle
              key={p.key}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={p.color}
              strokeWidth={active ? 14 : 10}
              strokeDasharray={`${dash} ${CIRC}`}
              strokeDashoffset={-offsets[i]}
              opacity={dim ? 0.35 : 1}
              onMouseEnter={() => onActiveChange?.(p.key)}
              className="transition-[stroke-width,opacity] duration-150 ease-out motion-reduce:transition-none"
            />
          )
        })}
      </svg>
      {children && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  )
}
