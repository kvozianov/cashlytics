'use client'

import { memo, useMemo } from 'react'

import { CategoryBadge, Money } from '@/components/demo/ui'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { totals, type Totals } from '@/lib/demo/analytics'
import { needsReview } from '@/lib/demo/categorize'
import { monthKey, weekday } from '@/lib/demo/dates'
import { formatDate, formatMonth, signedMoney } from '@/lib/demo/format'
import type { Transaction } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { PAGE_SIZE } from './ledger-utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface RowProps {
  tx: Transaction
  selecting: boolean
  selected: boolean
  active: boolean
  showBankText: boolean
  onToggle: (id: string, range: boolean) => void
  onOpen: (id: string) => void
}

/** One line of the statement: what, category, amount. Bank text only when asked for. */
const TxRow = memo(function TxRow({ tx, selecting, selected, active, showBankText, onToggle, onOpen }: RowProps) {
  const review = needsReview(tx)
  return (
    <li
      className={cn(
        'group relative flex items-center gap-3 px-4 py-3 transition-colors duration-150 sm:px-5',
        'hover:bg-muted/50',
        selected && 'bg-accent/20 hover:bg-accent/25 dark:bg-accent/10',
        active && 'bg-muted',
      )}
    >
      {selecting && (
        <Checkbox
          checked={selected}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(tx.id, e.shiftKey)
          }}
          aria-label={`Select ${tx.merchant}, ${formatDate(tx.date)}`}
          className="relative z-10 size-4"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-4">
        <div className="min-w-0 md:flex-1">
          <button
            type="button"
            onClick={(e) => (selecting ? onToggle(tx.id, e.shiftKey) : onOpen(tx.id))}
            className="block max-w-full truncate text-left text-[15px] after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
          >
            {tx.merchant}
          </button>
          {showBankText && <p className="truncate font-mono text-[11px] text-muted-foreground">{tx.description}</p>}
        </div>
        <div className="flex min-w-0 items-center gap-2 md:w-60 md:shrink-0">
          <CategoryBadge categoryId={tx.categoryId} size="sm" className="min-w-0" />
          {review && <span className="shrink-0 text-xs text-warning">needs review</span>}
        </div>
      </div>
      <Money
        value={tx.amount}
        signed
        tone={tx.categoryId === 'transfer' ? 'plain' : 'auto'}
        className="shrink-0 self-start text-right text-[15px] md:w-28 md:self-center"
      />
    </li>
  )
})

interface DayGroup {
  date: string
  items: Transaction[]
}
interface MonthGroup {
  month: string
  days: DayGroup[]
}

function groupPage(rows: Transaction[]): MonthGroup[] {
  const months: MonthGroup[] = []
  for (const t of rows) {
    const m = monthKey(t.date)
    let mg = months[months.length - 1]
    if (!mg || mg.month !== m) {
      mg = { month: m, days: [] }
      months.push(mg)
    }
    let dg = mg.days[mg.days.length - 1]
    if (!dg || dg.date !== t.date) {
      dg = { date: t.date, items: [] }
      mg.days.push(dg)
    }
    dg.items.push(t)
  }
  return months
}

function monthTotalsOf(rows: Transaction[]): Map<string, Totals> {
  const buckets = new Map<string, Transaction[]>()
  for (const t of rows) {
    const k = monthKey(t.date)
    const list = buckets.get(k)
    if (list) list.push(t)
    else buckets.set(k, [t])
  }
  return new Map([...buckets].map(([k, list]) => [k, totals(list)]))
}

interface LedgerProps {
  rows: Transaction[]
  page: number
  onPage: (page: number) => void
  grouped: boolean
  selecting: boolean
  showBankText: boolean
  selected: Set<string>
  activeId: string | null
  onToggle: (id: string, range: boolean) => void
  onOpen: (id: string) => void
}

/** The statement: month bands with one net figure, date gutters, quiet rows, one totals line. */
export function Ledger({ rows, page, onPage, grouped, selecting, showBankText, selected, activeId, onToggle, onOpen }: LedgerProps) {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const slice = useMemo(() => rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), [rows, current])
  const monthTotals = useMemo(() => monthTotalsOf(rows), [rows])
  const sum = useMemo(() => totals(rows), [rows])
  const groups = useMemo(() => (grouped ? groupPage(slice) : []), [grouped, slice])

  const row = (t: Transaction) => (
    <TxRow
      key={t.id}
      tx={t}
      selecting={selecting}
      selected={selected.has(t.id)}
      active={activeId === t.id}
      showBankText={showBankText}
      onToggle={onToggle}
      onOpen={onOpen}
    />
  )

  const go = (p: number) => {
    onPage(p)
    document.getElementById('ledger-top')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  return (
    <div data-tour="ledger" className="min-w-0 rounded-md border border-border bg-card">
      <div id="ledger-top" className="scroll-mt-[calc(var(--ledger-top)+1rem)]" />
      {grouped ? (
        groups.map((mg) => {
          const mt = monthTotals.get(mg.month)!
          return (
            <section key={mg.month} aria-label={formatMonth(mg.month, { long: true })} className="border-b border-border last:border-b-0">
              <header
                className="sticky top-[var(--ledger-top)] z-20 flex h-11 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 supports-[backdrop-filter]:backdrop-blur-sm sm:px-5"
                title={`Money in ${signedMoney(mt.income)} · money out ${signedMoney(-mt.expenses)}`}
              >
                <h3 className="font-display text-[15px] font-semibold tracking-tight">{formatMonth(mg.month, { long: true })}</h3>
                <span className="text-sm text-muted-foreground">
                  net <Money value={mt.net} signed tone={mt.net > 0 ? 'auto' : 'plain'} className="text-foreground" />
                </span>
              </header>
              {mg.days.map((dg) => (
                <div key={dg.date} className="grid grid-cols-[3rem_minmax(0,1fr)] border-b border-border last:border-b-0 sm:grid-cols-[4rem_minmax(0,1fr)]">
                  <div className="border-r border-border">
                    <div className="sticky top-[calc(var(--ledger-top)+2.75rem)] flex flex-col items-center py-3 font-mono tabular-nums">
                      <span className="text-[15px] leading-tight">{Number(dg.date.slice(8, 10))}</span>
                      <span className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{WEEKDAYS[weekday(dg.date)]}</span>
                    </div>
                  </div>
                  <ul className="min-w-0 divide-y divide-border" aria-label={formatDate(dg.date, { weekday: true })}>
                    {dg.items.map(row)}
                  </ul>
                </div>
              ))}
            </section>
          )
        })
      ) : (
        <div className="divide-y divide-border">
          {slice.map((t) => (
            <div key={t.id} className="grid grid-cols-[3rem_minmax(0,1fr)] sm:grid-cols-[4rem_minmax(0,1fr)]">
              <div className="flex flex-col items-center border-r border-border py-3 font-mono tabular-nums">
                <span className="text-[15px] leading-tight">{Number(t.date.slice(8, 10))}</span>
                <span className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{MONTHS[Number(t.date.slice(5, 7)) - 1]}</span>
              </div>
              <ul className="min-w-0">{row(t)}</ul>
            </div>
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border px-4 py-4 sm:px-5">
        <p
          className="text-sm text-muted-foreground"
          title={`Money in ${signedMoney(sum.income)} · money out ${signedMoney(-sum.expenses)}. Transfers between your own accounts are not counted.`}
        >
          {rows.length.toLocaleString('en-US')} {rows.length === 1 ? 'transaction' : 'transactions'}, net{' '}
          <Money value={sum.net} signed tone={sum.net > 0 ? 'auto' : 'plain'} className="text-foreground" />
        </p>
        {pages > 1 && (
          <nav aria-label="Pages" className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={current <= 1} onClick={() => go(current - 1)}>
              Previous
            </Button>
            <span className="px-2 text-sm text-muted-foreground tabular-nums" aria-live="polite">
              {current} of {pages}
            </span>
            <Button variant="ghost" size="sm" disabled={current >= pages} onClick={() => go(current + 1)}>
              Next
            </Button>
          </nav>
        )}
      </footer>
    </div>
  )
}
