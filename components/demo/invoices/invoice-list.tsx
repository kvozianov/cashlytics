'use client'

import { FileText } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/demo/ui'
import { money } from '@/lib/demo/format'
import { useInvoices } from '@/lib/demo/hooks'
import { useDemo } from '@/lib/demo/store'
import { cn } from '@/lib/utils'

import { STATUS_FILTERS, STATUS_LABEL, type StatusFilter } from './format'
import { StatusChip } from './status-chip'

const LIMIT = 8

interface InvoiceListProps {
  filter: StatusFilter
  onFilter: (f: StatusFilter) => void
  onOpen: (id: string) => void
  onSample: () => void
  onNew: () => void
}

export function InvoiceList({ filter, onFilter, onOpen, onSample, onNew }: InvoiceListProps) {
  const { persona } = useDemo()
  const rows = useInvoices()

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: rows.length, draft: 0, sent: 0, overdue: 0, paid: 0 }
    for (const r of rows) c[r.status]++
    return c
  }, [rows])

  const [all, setAll] = useState(false)
  const visible = useMemo(
    () =>
      rows
        .filter((r) => filter === 'all' || r.status === filter)
        .sort((a, b) => {
          // Problems first in "all", then newest.
          const rank = (s: string) => (filter === 'all' ? ({ overdue: 0, draft: 1, sent: 2, paid: 3 } as Record<string, number>)[s] : 0)
          return rank(a.status) - rank(b.status) || b.invoice.issueDate.localeCompare(a.invoice.issueDate) || b.invoice.number.localeCompare(a.invoice.number)
        }),
    [rows, filter],
  )
  const shown = all ? visible : visible.slice(0, LIMIT)

  return (
    <section aria-labelledby="invoice-list-title" data-tour="invoice-list" className="min-w-0 rounded-md border border-border bg-card">
      <h2 id="invoice-list-title" className="sr-only">
        Invoices
      </h2>
      <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-2 pt-2 [scrollbar-width:none]" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => onFilter(f)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-1.5 rounded-t-[3px] border border-transparent px-3 py-2 text-[13px] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground',
              filter === f && 'border-border border-b-card bg-card font-medium text-foreground',
            )}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
            {(f === 'overdue' || f === 'draft') && counts[f] > 0 && (
              <span className={cn('rounded-[2px] px-1 font-mono text-[11px] tabular-nums', filter === f ? 'bg-accent text-accent-foreground' : 'bg-muted', f === 'overdue' && filter !== f && 'text-destructive')}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="p-4 sm:p-5">
          {rows.length === 0 || persona.id === 'starter' ? (
            <EmptyState
              icon={FileText}
              title={rows.length === 0 ? 'No invoices yet' : `No ${filter === 'all' ? '' : STATUS_LABEL[filter as Exclude<StatusFilter, 'all'>].toLowerCase()} invoices`}
              description="An invoice asks a client to pay for work you did. Once it is paid here, the money lands in your income and the tax estimate updates by itself."
              action={{ label: 'Create a sample invoice', onClick: onSample }}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title={`No ${STATUS_LABEL[filter as Exclude<StatusFilter, 'all'>].toLowerCase()} invoices`}
              description={filter === 'overdue' ? 'Every sent invoice is within its terms. Nice.' : 'Nothing in this list right now.'}
              action={{ label: 'New invoice', onClick: onNew }}
            />
          )}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-dashed divide-border">
            {shown.map(({ invoice, status, total, client }) => (
              <li key={invoice.id} data-tour={status === 'overdue' ? 'invoice-overdue' : status === 'sent' ? 'invoice-unpaid' : undefined}>
                <button
                  type="button"
                  onClick={() => onOpen(invoice.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto_6.5rem] items-center gap-x-4 px-4 py-3.5 text-left hover:bg-muted/50 sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px]">{client?.name ?? '—'}</span>
                    <span className="block font-mono text-[12px] text-muted-foreground tabular-nums">{invoice.number}</span>
                  </span>
                  <StatusChip status={status} />
                  <span className="text-right font-mono text-[15px] tabular-nums">{money(total, { whole: total % 1 === 0 })}</span>
                </button>
              </li>
            ))}
          </ul>
          {visible.length > LIMIT && (
            <div className="border-t border-border px-4 py-3 sm:px-5">
              <button type="button" onClick={() => setAll((a) => !a)} className="text-[13px] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
                {all ? 'Show fewer' : `Show all ${visible.length}`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
