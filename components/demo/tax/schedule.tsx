'use client'

import { useId, useState } from 'react'

import { ChangeList, takeSnapshot, type Snapshot } from '@/components/demo/invoices/knock-on'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { accountBalances } from '@/lib/demo/analytics'
import { isValidISODate } from '@/lib/demo/dates'
import { formatDate, money } from '@/lib/demo/format'
import { useDemo } from '@/lib/demo/store'
import type { QuarterStatus, TaxEstimate, TaxQuarter } from '@/lib/demo/tax'
import { cn } from '@/lib/utils'

const STAMP: Record<QuarterStatus, { text: string }> = {
  paid: { text: 'Paid' },
  overdue: { text: 'Overdue' },
  due: { text: 'Due soon' },
  upcoming: { text: 'Upcoming' },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const span = (q: TaxQuarter) => `${MONTHS[Number(q.periodStart.slice(5, 7)) - 1]}–${MONTHS[Number(q.periodEnd.slice(5, 7)) - 1]}`

/** The four quarterly payments as a timeline, each stamped with its status. */
export function Schedule({ estimate }: { estimate: TaxEstimate }) {
  const { today } = useDemo()
  const [paying, setPaying] = useState<TaxQuarter | null>(null)
  const [after, setAfter] = useState<{ quarter: TaxQuarter; before: Snapshot } | null>(null)

  return (
    <section id="schedule" aria-labelledby="schedule-title" className="scroll-mt-40 sm:scroll-mt-28 rounded-md border border-border bg-card data-[flash]:outline-2 data-[flash]:outline-offset-4 data-[flash]:outline-lime">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div>
          <h2 id="schedule-title" className="text-sm font-semibold tracking-tight">
            Quarterly payments, {estimate.year}
          </h2>
          <p className="text-[13px] text-muted-foreground">Tax is paid in four instalments. Each covers the profit made in its quarter.</p>
        </div>
      </div>

      <ol className="relative grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2 xl:grid-cols-4">
        {estimate.quarters.map((q, i) => {
          const open = Math.max(0, q.amount - q.paid)
          const s = STAMP[q.status]
          return (
            <li
              key={q.quarter}
              className={cn(
                'relative flex flex-col gap-3 border-border p-4 sm:p-5',
                i > 0 && 'border-t sm:border-t-0',
                i % 2 === 1 && 'sm:border-l',
                i >= 2 && 'sm:border-t xl:border-t-0',
                i === 2 && 'xl:border-l',
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-2.5 rounded-full border-2',
                    q.status === 'paid' ? 'border-success bg-success' : q.status === 'overdue' ? 'border-destructive bg-destructive' : 'border-foreground bg-card',
                  )}
                />
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-medium">{q.label}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {span(q)} profit · due {formatDate(q.dueDate, { year: q.dueDate.slice(0, 4) !== String(estimate.year) })}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-[2px] border border-current px-1.5 py-px font-mono text-[11px] font-medium tracking-[0.12em] whitespace-nowrap uppercase',
                    q.status === 'paid' ? 'text-success' : q.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {s.text}
                </span>
              </div>
              <dl className="space-y-1 text-[13px]">
                <div className="flex items-baseline gap-2">
                  <dt className="text-muted-foreground">{q.periodEnd <= today ? 'Estimate' : 'Projected'}</dt>
                  <span aria-hidden="true" className="ldr-leader" />
                  <dd className="font-mono tabular-nums">{money(q.amount, { whole: true })}</dd>
                </div>
                <div className="flex items-baseline gap-2">
                  <dt className="text-muted-foreground">Paid</dt>
                  <span aria-hidden="true" className="ldr-leader" />
                  <dd className="font-mono tabular-nums">{money(q.paid, { whole: true })}</dd>
                </div>
              </dl>
              {q.status !== 'paid' && open > 0.5 && (
                <Button size="sm" variant={q.status === 'overdue' ? 'default' : 'outline'} className="mt-auto self-start" onClick={() => setPaying(q)}>
                  Record payment
                  <span className="sr-only"> for {q.label}</span>
                </Button>
              )}
            </li>
          )
        })}
      </ol>

      {after && (
        <div className="border-t border-border px-4 py-4 sm:px-6">
          <AfterPayment quarter={after.quarter} before={after.before} onDismiss={() => setAfter(null)} />
        </div>
      )}

      <RecordPaymentDialog
        quarter={paying}
        estimate={estimate}
        onClose={() => setPaying(null)}
        onRecorded={(quarter, before) => {
          setPaying(null)
          setAfter({ quarter, before })
        }}
      />
    </section>
  )
}

function AfterPayment({ quarter, before, onDismiss }: { quarter: TaxQuarter; before: Snapshot; onDismiss: () => void }) {
  const { state, today } = useDemo()
  const now = takeSnapshot(state, today)
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">What moved · {quarter.label} payment</p>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
      <ChangeList
        changes={[
          { label: 'Cash you can spend', before: before.liquid, after: now.liquid, href: '/demo', hrefLabel: 'open the overview' },
          { label: 'Tax reserve', before: before.setAside, after: now.setAside, goodWhen: 'neutral' },
          { label: 'Health score', before: before.health, after: now.health, kind: 'number', href: '/demo/insights', hrefLabel: 'open insights' },
        ]}
      />
    </div>
  )
}

export function RecordPaymentDialog({
  quarter,
  estimate,
  onClose,
  onRecorded,
}: {
  quarter: TaxQuarter | null
  estimate: TaxEstimate
  onClose: () => void
  onRecorded: (q: TaxQuarter, before: Snapshot) => void
}) {
  return (
    <Dialog open={!!quarter} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {quarter && <RecordPaymentForm key={quarter.quarter} quarter={quarter} year={estimate.year} onClose={onClose} onRecorded={onRecorded} />}
      </DialogContent>
    </Dialog>
  )
}

function RecordPaymentForm({ quarter, year, onClose, onRecorded }: { quarter: TaxQuarter; year: number; onClose: () => void; onRecorded: (q: TaxQuarter, before: Snapshot) => void }) {
  const uid = useId()
  const { state, today, actions } = useDemo()
  const balances = accountBalances(state, today)
  const accounts = state.accounts
  const reserve = accounts.find((a) => a.purpose === 'tax')
  const [amount, setAmount] = useState(String(Math.round(Math.max(0, quarter.amount - quarter.paid))))
  const [date, setDate] = useState(today)
  const [accountId, setAccountId] = useState(reserve?.id ?? accounts.find((a) => a.purpose === 'everyday')?.id ?? accounts[0].id)
  const [touched, setTouched] = useState(false)

  const value = Number(amount.replace(/[,$\s]/g, ''))
  const balance = balances.find((b) => b.account.id === accountId)?.balance ?? 0
  const amountError = !Number.isFinite(value) || value <= 0 ? 'Enter an amount above $0.' : value > 1_000_000 ? 'That is more than this demo allows.' : ''
  const dateError = !isValidISODate(date) ? 'Enter a valid date.' : date > today ? 'Record payments you have made, not future ones.' : ''
  const warn = !amountError && value > balance ? `More than the ${money(balance)} in this account; it would go negative.` : ''

  function submit() {
    setTouched(true)
    if (amountError || dateError) return
    const before = takeSnapshot(state, today)
    actions.recordTaxPayment(year, quarter.quarter, Math.round(value * 100) / 100, { date, accountId })
    onRecorded(quarter, before)
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="grid gap-4"
    >
      <DialogHeader>
        <DialogTitle>Record a payment for {quarter.label}</DialogTitle>
        <DialogDescription>
          Adds a tax payment to your transactions. Estimate {money(quarter.amount, { whole: true })}, already paid {money(quarter.paid, { whole: true })}.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-amt`}>Amount, $</Label>
        <Input
          id={`${uid}-amt`}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={touched && !!amountError}
          aria-describedby={`${uid}-amt-msg`}
          className="font-mono"
          autoFocus
        />
        <p id={`${uid}-amt-msg`} className={cn('text-[12px]', touched && amountError ? 'text-destructive' : 'text-warning')}>
          {(touched && amountError) || warn}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-date`}>Paid on</Label>
          <Input
            id={`${uid}-date`}
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={touched && !!dateError}
            aria-describedby={`${uid}-date-err`}
            className="font-mono"
          />
          <p id={`${uid}-date-err`} className="text-[12px] text-destructive">
            {touched ? dateError : ''}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-from`}>From</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger id={`${uid}-from`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} · {money(balances.find((b) => b.account.id === a.id)?.balance ?? 0, { whole: true })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Record payment</Button>
      </DialogFooter>
    </form>
  )
}
