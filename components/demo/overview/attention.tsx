'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { MarginNote } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { getCategory } from '@/lib/demo/categories'
import { diffDays } from '@/lib/demo/dates'
import { count, formatDate, money } from '@/lib/demo/format'
import { useBudgetProgress, useInvoices, useReviewQueue, useSubscriptions, useTaxEstimate, useToday } from '@/lib/demo/hooks'
import { daysOverdue } from '@/lib/demo/invoices'
import { cn } from '@/lib/utils'

type Tone = 'signal' | 'ink' | 'success'

interface Item {
  key: string
  tone: Tone
  title: string
  detail: string
  action: { label: string; href: string }
}

/** The merged to-do list: at most five things, most urgent first, one action each. */
export function Attention({ className }: { className?: string }) {
  const today = useToday()
  const invoices = useInvoices()
  const tax = useTaxEstimate()
  const budgets = useBudgetProgress()
  const review = useReviewQueue()
  const subs = useSubscriptions()

  const items = useMemo(() => {
    const out: Item[] = []
    const overdue = invoices.filter((i) => i.status === 'overdue').sort((a, b) => b.total - a.total)
    for (const i of overdue.slice(0, 2)) {
      const days = daysOverdue(i.invoice, today)
      out.push({
        key: `inv-${i.invoice.id}`,
        tone: 'signal',
        title: `Chase ${i.client?.name ?? 'a client'} for ${i.invoice.number}`,
        detail: `${money(i.total, { whole: true })}, ${count(days, 'day')} late`,
        action: { label: 'Chase', href: '/demo/invoices?status=overdue' },
      })
    }

    const lateQuarters = tax.quarters.filter((q) => q.status === 'overdue')
    const unpaid = lateQuarters.reduce((s, q) => s + Math.max(0, q.amount - q.paid), 0)
    if (lateQuarters.length && unpaid > 1) {
      out.push({
        key: 'tax-overdue',
        tone: 'signal',
        title: lateQuarters.length === 1 ? `${lateQuarters[0].label} payment is late` : `${lateQuarters.length} tax payments are late`,
        detail: `${money(unpaid, { whole: true })} not paid yet`,
        action: { label: 'Plan it', href: '/demo/tax' },
      })
    }
    const next = tax.quarters.find((q) => q.status === 'due' || (q.status === 'upcoming' && diffDays(q.dueDate, today) <= 30))
    if (next && next.amount - next.paid > 1) {
      out.push({
        key: 'tax-next',
        tone: 'ink',
        title: `${next.label} tax payment`,
        detail: `About ${money(next.amount - next.paid, { whole: true })}, due ${formatDate(next.dueDate, { year: false })}`,
        action: { label: 'Open tax', href: '/demo/tax' },
      })
    }

    const over = budgets.filter((b) => b.status === 'over')
    if (over.length) {
      const excess = over.reduce((s, b) => s + b.spent - b.limit, 0)
      out.push({
        key: 'budgets',
        tone: 'signal',
        title:
          over.length === 1
            ? `${getCategory(over[0].categoryId).label} is over budget`
            : `${over.length} budgets over: ${over.map((b) => getCategory(b.categoryId).label.toLowerCase()).join(', ')}`,
        detail: `${money(excess, { whole: true })} above the limit this month`,
        action: { label: 'Adjust', href: '/demo/plan' },
      })
    }

    if (review.length) {
      out.push({
        key: 'review',
        tone: 'ink',
        title: `${count(review.length, 'transaction')} to check`,
        detail: 'The rules were not sure about the category',
        action: { label: 'Review', href: '/demo/transactions?review=1' },
      })
    }

    const raised = subs.filter((s) => s.active && s.priceChange && diffDays(today, s.priceChange.since) <= 120)
    if (raised.length) {
      const s = raised[0]
      out.push({
        key: 'price',
        tone: 'ink',
        title: `${s.merchant} raised its price`,
        detail: `${money(s.priceChange!.from)} → ${money(s.priceChange!.to)} a ${s.cadence === 'monthly' ? 'month' : 'year'}${raised.length > 1 ? `, and ${raised.length - 1} more` : ''}`,
        action: { label: 'See', href: '/demo/insights#subscriptions' },
      })
    }
    return out.slice(0, 3)
  }, [invoices, tax, budgets, review, subs, today])

  return (
    <section aria-labelledby="attention-title" className={cn('min-w-0', className)}>
      <h2 id="attention-title" className="font-display text-xl font-semibold tracking-tight">
        Do this next
      </h2>
      {items.length ? (
        <ol className="mt-4 divide-y divide-border border-y border-border">
          {items.map((item, i) => (
            <li key={item.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-pretty">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
              </div>
              {i === 0 && (
                <MarginNote arrow="right" tone="signal" rotate={-3} size="sm" still className="hidden md:inline-flex">
                  start here
                </MarginNote>
              )}
              <Button asChild size="sm" variant={i === 0 ? 'default' : 'outline'} className="shrink-0">
                <Link href={item.action.href}>{item.action.label}</Link>
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 border-y border-border py-6 text-muted-foreground">Nothing needs you right now: no overdue invoices, late tax, broken budgets or transactions to check.</p>
      )}
    </section>
  )
}
