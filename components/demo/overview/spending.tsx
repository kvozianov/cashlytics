'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { ChartSummary, Donut, foldCategories } from '@/components/demo/charts'
import { money, pct } from '@/lib/demo/format'
import { useCategoryBreakdown } from '@/lib/demo/hooks'
import { useDemo } from '@/lib/demo/store'
import { cn } from '@/lib/utils'

import { PERIOD_WORDS } from './words'

/** Where the money went in the selected period: a ring and the top categories, each linking into transactions. */
export function Spending({ className }: { className?: string }) {
  const { state } = useDemo()
  const current = useCategoryBreakdown('expense')
  const folded = useMemo(() => foldCategories(current, 5), [current])
  const [hover, setHover] = useState<string | null>(null)
  const words = PERIOD_WORDS[state.period]

  return (
    <section aria-labelledby="spending-title" className={cn('min-w-0', className)}>
      <h3 id="spending-title" className="font-semibold tracking-tight">
        Where the money went <span className="font-normal text-muted-foreground">· {words.short}</span>
      </h3>
      {folded.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No spending in this period. Pick a longer period in the top bar.</p>
      ) : (
        <div className="mt-4 grid items-center gap-6 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <Donut
            slices={folded.map((f) => ({ key: f.key, label: f.label, value: f.total, color: f.color }))}
            activeKey={hover}
            onActiveChange={setHover}
            label={`Spending by category, ${words.short}`}
            className="mx-auto w-32 sm:w-36"
          />
          <ol className="min-w-0" onMouseLeave={() => setHover(null)}>
            {folded.map((f) => (
              <li key={f.key} onMouseEnter={() => setHover(f.key)} onFocus={() => setHover(f.key)} onBlur={() => setHover(null)}>
                <Link
                  href={f.key === 'other' ? '/demo/transactions' : `/demo/transactions?category=${f.key}`}
                  className={cn('flex items-baseline gap-2 rounded-sm px-1.5 py-1.5 text-sm transition-colors hover:bg-muted/50', hover === f.key && 'bg-muted/50')}
                >
                  <span aria-hidden="true" className="size-2.5 shrink-0 self-center rounded-[2px]" style={{ backgroundColor: f.color }} />
                  <span className="min-w-0 truncate">{f.label}</span>
                  <span aria-hidden="true" className="ldr-leader min-w-3" />
                  <span className="shrink-0 font-mono tabular-nums">{money(f.total, { whole: true })}</span>
                </Link>
              </li>
            ))}
          </ol>
          <ChartSummary>
            Largest: {folded[0].label}, {money(folded[0].total, { whole: true })}, {pct(folded[0].share)} of spending.
          </ChartSummary>
        </div>
      )}
    </section>
  )
}
