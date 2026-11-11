'use client'

import { useMemo } from 'react'

import { addDays } from '@/lib/demo/dates'
import { formatDate, signedMoney } from '@/lib/demo/format'
import { useInvoices, useSubscriptions, useTaxEstimate, useToday } from '@/lib/demo/hooks'
import { cn } from '@/lib/utils'

interface Event {
  key: string
  date: string
  label: string
  amount: number
}

/** What is expected in the next 30 days: recurring charges, invoices falling due, tax. */
export function Upcoming({ className }: { className?: string }) {
  const today = useToday()
  const subs = useSubscriptions()
  const invoices = useInvoices()
  const tax = useTaxEstimate()
  const end = addDays(today, 30)

  const events = useMemo(() => {
    const out: Event[] = []
    for (const s of subs) if (s.active && s.nextDate >= today && s.nextDate <= end) out.push({ key: `s-${s.merchant}`, date: s.nextDate, label: s.merchant, amount: -s.amount })
    for (const i of invoices)
      if (i.status === 'sent' && i.invoice.dueDate >= today && i.invoice.dueDate <= end)
        out.push({ key: `i-${i.invoice.id}`, date: i.invoice.dueDate, label: `${i.client?.name ?? 'Client'} invoice`, amount: i.total })
    for (const q of tax.quarters)
      if (q.status !== 'paid' && q.dueDate >= today && q.dueDate <= end) out.push({ key: `t-${q.label}`, date: q.dueDate, label: `${q.label} tax`, amount: -Math.max(0, q.amount - q.paid) })
    return out.sort((a, b) => a.date.localeCompare(b.date))
  }, [subs, invoices, tax, today, end])

  return (
    <section aria-labelledby="upcoming-title" className={cn('min-w-0', className)}>
      <h3 id="upcoming-title" className="font-semibold tracking-tight">
        Coming up in the next 30 days
      </h3>
      {events.length ? (
        <ul className="mt-3">
          {events.slice(0, 6).map((e) => (
            <li key={e.key} className="flex items-baseline gap-2 py-1.5 text-sm">
              <span className="w-12 shrink-0 text-muted-foreground">{formatDate(e.date, { year: false })}</span>
              <span className="min-w-0 truncate">{e.label}</span>
              <span aria-hidden="true" className="ldr-leader min-w-3" />
              <span className={cn('shrink-0 font-mono tabular-nums', e.amount > 0 && 'text-success')}>{signedMoney(e.amount)}</span>
            </li>
          ))}
          {events.length > 6 && <li className="pt-1 text-sm text-muted-foreground">and {events.length - 6} more</li>}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Nothing expected.</p>
      )}
    </section>
  )
}
