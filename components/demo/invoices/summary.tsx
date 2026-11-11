'use client'

import { useMemo } from 'react'

import { Odometer } from '@/components/brand'
import { filterByRange, PERIODS } from '@/lib/demo/analytics'
import { diffDays } from '@/lib/demo/dates'
import { count, money } from '@/lib/demo/format'
import { usePeriod, useReceivables } from '@/lib/demo/hooks'
import { ageingBuckets, invoiceTotal } from '@/lib/demo/invoices'
import { useDemo } from '@/lib/demo/store'
import { cn } from '@/lib/utils'

/** Words first, then the two figures that matter: what you are waiting for and what is late. */
export function InvoiceSummary() {
  const recv = useReceivables()
  const sentence =
    recv.outstandingCount === 0
      ? 'Nobody owes you anything right now.'
      : `You are waiting on ${count(recv.outstandingCount, 'invoice')}.${recv.overdueCount ? ` ${recv.overdueCount === 1 ? 'One is' : `${recv.overdueCount} are`} past due.` : ' None is late.'}`

  return (
    <section aria-label="What you are owed" className="space-y-5">
      <p className="max-w-xl font-display text-xl leading-snug font-medium tracking-tight text-balance sm:text-2xl">{sentence}</p>
      <dl className="flex flex-wrap gap-x-14 gap-y-5">
        <div>
          <dt className="text-sm text-muted-foreground">Waiting to be paid</dt>
          <dd className="mt-1 font-mono text-3xl font-medium tracking-tight tabular-nums sm:text-4xl">
            <Odometer value={Math.round(recv.outstanding)} format="usd" rollOnMount={false} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Overdue</dt>
          <dd className={cn('mt-1 font-mono text-3xl font-medium tracking-tight tabular-nums sm:text-4xl', recv.overdue > 0 && 'text-destructive')}>
            <Odometer value={Math.round(recv.overdue)} format="usd" rollOnMount={false} />
          </dd>
        </div>
      </dl>
    </section>
  )
}

/** Detail view: how old the unpaid money is, how fast clients pay, what came in this period. */
export function PaymentSpeed() {
  const { state, today } = useDemo()
  const { period, range } = usePeriod()

  const { paidInPeriod, paidCount, avgDays } = useMemo(() => {
    const paid = state.invoices.filter((i) => i.status === 'paid' && i.paidDate)
    const inPeriod = filterByRange(
      paid.map((i) => ({ ...i, date: i.paidDate! })),
      range,
    )
    const recent = paid.filter((i) => diffDays(today, i.paidDate!) <= 365)
    const days = recent.map((i) => diffDays(i.paidDate!, i.issueDate))
    return {
      paidInPeriod: inPeriod.reduce((s, i) => s + invoiceTotal(i), 0),
      paidCount: inPeriod.length,
      avgDays: days.length ? Math.round(days.reduce((s, d) => s + d, 0) / days.length) : null,
    }
  }, [state.invoices, range, today])
  const periodLabel = PERIODS.find((p) => p.id === period)?.label.toLowerCase() ?? 'this period'

  return (
    <div className="max-w-3xl space-y-6">
      <dl className="flex flex-wrap gap-x-12 gap-y-4">
        <div>
          <dt className="text-sm text-muted-foreground">Paid, {periodLabel}</dt>
          <dd className="mt-1 font-mono text-xl tabular-nums">
            {money(paidInPeriod, { whole: true })} <span className="text-sm text-muted-foreground">· {count(paidCount, 'invoice')}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Average days from invoice to payment</dt>
          <dd className="mt-1 font-mono text-xl tabular-nums">{avgDays ?? '—'}</dd>
        </div>
      </dl>
      <Ageing />
    </div>
  )
}

function Ageing() {
  const { state, today } = useDemo()
  const buckets = useMemo(() => {
    const b = ageingBuckets(state.invoices, today)
    const over60 = { id: '60+', label: '60+ days', amount: b[3].amount + b[4].amount, count: b[3].count + b[4].count }
    return [
      { ...b[0], label: 'Not yet due' },
      { ...b[1], label: '1–30 days late' },
      { ...b[2], label: '31–60 days late' },
      { ...over60, label: '60+ days late' },
    ]
  }, [state.invoices, today])
  const total = buckets.reduce((s, b) => s + b.amount, 0)
  const tones = ['bg-foreground/80', 'bg-warning', 'bg-destructive', 'bg-destructive']
  const patterns = ['', '', '', 'bg-[repeating-linear-gradient(135deg,transparent_0_3px,var(--card)_3px_5px)]']

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">How long unpaid money has been waiting</p>
      {total <= 0 ? (
        <p className="text-sm text-muted-foreground">Nothing outstanding. Every sent invoice is paid.</p>
      ) : (
        <div>
          <div className="flex h-3 w-full gap-[2px]" role="img" aria-label={buckets.map((b) => `${b.label}: ${money(b.amount, { whole: true })}`).join(', ')}>
            {buckets.map((b, i) =>
              b.amount > 0 ? (
                <span
                  key={b.id}
                  className={cn('relative h-full first:rounded-l-[2px] last:rounded-r-[2px] transition-[flex-grow] duration-500', tones[i])}
                  style={{ flexGrow: b.amount, flexBasis: 0, minWidth: 6 }}
                >
                  {patterns[i] && <span className={cn('absolute inset-0', patterns[i])} />}
                </span>
              ) : null,
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
            {buckets.map((b, i) => (
              <li key={b.id} className={cn('flex items-center gap-1.5', b.amount === 0 && 'text-muted-foreground')}>
                <span aria-hidden="true" className={cn('relative size-2.5 rounded-[2px]', b.amount ? tones[i] : 'border border-border')}>
                  {b.amount > 0 && patterns[i] && <span className={cn('absolute inset-0', patterns[i])} />}
                </span>
                {b.label}
                <span className="font-mono tabular-nums">{money(b.amount, { whole: true })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
