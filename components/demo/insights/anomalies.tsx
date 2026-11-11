'use client'

import Link from 'next/link'

import { BarCompare } from '@/components/demo/charts'
import { CategoryBadge } from '@/components/demo/ui'
import { addMonthsToKey, monthKey } from '@/lib/demo/dates'
import { formatMonth, money } from '@/lib/demo/format'
import { useAnomalies, useToday } from '@/lib/demo/hooks'

/** Categories that jumped last month compared with their usual level. */
export function Anomalies({ className }: { className?: string }) {
  const list = useAnomalies()
  const today = useToday()
  const month = addMonthsToKey(monthKey(today), -1)
  return (
    <div className={className}>
      <p className="text-lg text-pretty">
        {list.length
          ? `${list.length === 1 ? 'One category' : `${list.length} categories`} jumped in ${formatMonth(month, { long: true, year: false })} compared with the three months before.`
          : `Nothing jumped in ${formatMonth(month, { long: true, year: false })}: every category stayed close to its usual level.`}
      </p>
      {list.length > 0 && (
        <ul className="mt-6 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {list.slice(0, 4).map((a) => (
            <li key={a.categoryId} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/demo/transactions?category=${a.categoryId}`} className="rounded-sm hover:opacity-80">
                  <CategoryBadge categoryId={a.categoryId} />
                </Link>
                <span className="font-mono text-sm text-destructive tabular-nums">+{money(a.amount - a.average, { whole: true })}</span>
              </div>
              <BarCompare
                format={(n) => money(n, { whole: true })}
                items={[
                  { label: 'Usual month', value: a.average, tone: 'muted' },
                  { label: formatMonth(a.month, { year: false }), value: a.amount, tone: 'signal' },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-muted-foreground">Flagged when a category is 35% and at least $75 above its three-month average.</p>
    </div>
  )
}
