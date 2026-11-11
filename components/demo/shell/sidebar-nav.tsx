'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { needsReview } from '@/lib/demo/categorize'
import { useReceivables } from '@/lib/demo/hooks'
import { useDemo } from '@/lib/demo/store'
import { cn } from '@/lib/utils'

import { DEMO_NAV, isActive } from './nav'

/** The list of demo sections, with small counters for things that need attention. */
export function SidebarNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { state } = useDemo()
  const receivables = useReceivables()
  const reviewCount = state.transactions.filter(needsReview).length
  // Quiet hooks into the review queue and overdue invoices: a plain number, a small dot when something is late.
  const counters: Record<string, { value: number; label: string; urgent?: boolean } | undefined> = {
    '/demo/transactions': reviewCount ? { value: reviewCount, label: `${reviewCount} to review` } : undefined,
    '/demo/invoices': receivables.overdueCount ? { value: receivables.overdueCount, label: `${receivables.overdueCount} overdue`, urgent: true } : undefined,
  }

  return (
    <nav aria-label="Demo sections">
      <ul className="space-y-0.5">
        {DEMO_NAV.map((item) => {
          const active = isActive(pathname, item.href)
          const counter = counters[item.href]
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                  active ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-0',
                )}
              >
                <item.icon aria-hidden="true" className="size-4 shrink-0" />
                <span className={cn('flex-1 truncate', collapsed && 'sr-only')}>{item.label}</span>
                {counter && (
                  <span className={cn('flex items-center gap-1.5 font-mono text-[11px] leading-5 tabular-nums', !active && 'text-muted-foreground', collapsed && 'sr-only')}>
                    {counter.urgent && <span aria-hidden="true" className="size-1.5 rounded-full bg-destructive" />}
                    {counter.value}
                    <span className="sr-only"> {counter.label}</span>
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
