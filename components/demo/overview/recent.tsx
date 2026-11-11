'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { CategoryBadge, Money } from '@/components/demo/ui'
import { useDemoState } from '@/lib/demo/hooks'
import { cn } from '@/lib/utils'

/** The newest transactions: what, category, amount. */
export function Recent({ className }: { className?: string }) {
  const state = useDemoState()
  const rows = state.transactions.slice(0, 6)
  return (
    <section aria-labelledby="recent-title" className={cn('min-w-0', className)}>
      <h3 id="recent-title" className="font-semibold tracking-tight">
        Latest transactions
      </h3>
      {rows.length ? (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((t) => (
            <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 sm:grid-cols-[minmax(0,1fr)_11rem_6.5rem]">
              <span className="min-w-0 truncate text-sm">{t.merchant}</span>
              <span className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1">
                <CategoryBadge categoryId={t.categoryId} size="sm" />
              </span>
              <Money value={t.amount} className="text-right text-sm" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No transactions yet. Use Add in the top bar.</p>
      )}
      <Link href="/demo/transactions" className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
        All transactions <ArrowRight aria-hidden="true" className="size-3.5" />
      </Link>
    </section>
  )
}
