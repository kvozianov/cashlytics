'use client'

import Link from 'next/link'

import { useHealthScore } from '@/lib/demo/hooks'
import { cn } from '@/lib/utils'

/** Compact financial health score that links to Insights. */
export function HealthBadge({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  const health = useHealthScore()
  const label = `Financial health ${health.score} out of 100, ${health.label}. Open insights.`
  return (
    <Link
      href="/demo/insights"
      aria-label={label}
      title={collapsed ? label : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        collapsed && 'justify-center px-0',
        className,
      )}
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(health.score / 100) * 97.4} 97.4`}
            className="text-foreground transition-[stroke-dasharray] duration-300"
          />
        </svg>
        <span className="font-mono text-xs font-medium tabular-nums">{health.score}</span>
      </span>
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block text-[13px] font-medium">Health {health.grade}</span>
          <span className="block truncate text-xs text-muted-foreground">{health.label}</span>
        </span>
      )}
    </Link>
  )
}
