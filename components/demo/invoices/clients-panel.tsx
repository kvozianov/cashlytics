'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { MarginNote } from '@/components/brand'
import { money } from '@/lib/demo/format'
import { useClientStats } from '@/lib/demo/hooks'
import { cn } from '@/lib/utils'

const LATE_DAYS = 14

/** Who you bill, how much, and how long they take. The late payer gets a note in the margin. */
export function ClientsPanel() {
  const stats = useClientStats()
  const rows = useMemo(() => [...stats].filter((s) => s.invoiced > 0 || s.outstanding > 0).sort((a, b) => b.invoiced - a.invoiced), [stats])
  const latest = useMemo(() => {
    const late = rows.filter((r) => (r.avgDaysLate ?? 0) >= LATE_DAYS || r.maxDaysOverdue > 0)
    return late.sort((a, b) => (b.avgDaysLate ?? 0) + b.maxDaysOverdue - ((a.avgDaysLate ?? 0) + a.maxDaysOverdue))[0]?.client.id
  }, [rows])
  const total = rows.reduce((s, r) => s + r.invoiced, 0)

  return (
    <section aria-labelledby="clients-title" className="min-w-0 rounded-md border border-border bg-card">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <h2 id="clients-title" className="text-sm font-semibold tracking-tight">
          Clients
        </h2>
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Billed · avg days late</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">No clients billed yet.</p>
      ) : (
        <ul className="px-4 sm:px-5">
          {rows.map((r) => {
            const late = (r.avgDaysLate ?? 0) >= LATE_DAYS || r.maxDaysOverdue > 0
            const flagged = r.client.id === latest
            return (
              <li key={r.client.id} className="border-b border-dashed border-border py-3 last:border-b-0">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 truncate text-[13.5px] font-medium">{r.client.name}</span>
                  <span aria-hidden="true" className="ldr-leader" />
                  <span className="shrink-0 font-mono text-[13px] tabular-nums">{money(r.invoiced, { whole: true })}</span>
                  <span
                    className={cn(
                      'w-16 shrink-0 text-right font-mono whitespace-nowrap text-[13px] tabular-nums',
                      late ? 'font-medium text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {r.avgDaysLate === null ? '—' : r.avgDaysLate <= 0 ? 'on time' : `+${r.avgDaysLate}d`}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-muted-foreground">
                  <span>Net {r.client.termsDays}</span>
                  <span>{r.paidCount} paid</span>
                  {r.outstanding > 0 && <span className="font-mono tabular-nums">{money(r.outstanding, { whole: true })} open</span>}
                  {r.maxDaysOverdue > 0 && <span className="font-mono text-destructive tabular-nums">{r.maxDaysOverdue}d overdue now</span>}
                  {late && <span className="sr-only">Late payer.</span>}
                </div>
                {flagged && (
                  <div className="mt-1.5 pl-1">
                    <MarginNote arrow="up" tone="signal" rotate={-2} size="sm">
                      pays {r.avgDaysLate ?? r.maxDaysOverdue} days late on average. Ask for a deposit, or shorter terms?
                    </MarginNote>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {total > 0 && (
        <p className="border-t border-border px-4 py-3 text-[12.5px] text-muted-foreground sm:px-5">
          Days late = payment date minus due date, averaged over paid invoices. This is what the late-payer weak point in{' '}
          <Link href="/demo/insights" className="underline underline-offset-4">
            Insights
          </Link>{' '}
          is built from.
        </p>
      )}
    </section>
  )
}
