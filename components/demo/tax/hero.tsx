'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'

import { Circled, Odometer } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { accountBalances } from '@/lib/demo/analytics'
import { diffDays } from '@/lib/demo/dates'
import { formatDate, money, pct } from '@/lib/demo/format'
import { useDemo } from '@/lib/demo/store'
import { nextTaxDue, type TaxEstimate, type TaxQuarter } from '@/lib/demo/tax'
import type { TaxSettings } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { Ring } from './ring'
import { RecordPaymentDialog } from './schedule'

/** The estimate in one sentence and one line of arithmetic. */
export function EstimateHero({ estimate, settings }: { estimate: TaxEstimate; settings: TaxSettings }) {
  const bracketed = !!settings.brackets?.length
  const effective = estimate.base > 0 ? estimate.estimatedTax / estimate.base : 0
  return (
    <section aria-labelledby="estimate-title" className="space-y-4">
      <h2 id="estimate-title" className="text-lg text-muted-foreground">
        Tax on what you have earned this year, so far
      </h2>
      <p className="pl-2 font-mono text-5xl font-medium tracking-tight tabular-nums sm:pl-0 sm:text-6xl">
        <Circled color="signal">
          <Odometer value={Math.round(estimate.estimatedTax)} format="usd" rollOnMount={false} />
        </Circled>
      </p>
      <p className="max-w-xl text-[15px] text-pretty text-muted-foreground">
        <span className="font-mono text-foreground">{money(estimate.taxableIncome, { whole: true })}</span> earned −{' '}
        <span className="font-mono text-foreground">{money(estimate.deductions, { whole: true })}</span> in business costs
        {estimate.allowance > 0 && <> − a {money(estimate.allowance, { whole: true })} allowance</>}, taxed at{' '}
        <span className="font-mono text-foreground">{bracketed ? `${pct(effective, 1)} on average` : pct(settings.rate)}</span>.
      </p>
    </section>
  )
}

/** Set aside vs needed, as a ring and one sentence, with the one action that fixes a gap. */
export function CoverCard({ estimate }: { estimate: TaxEstimate }) {
  const { state, today, actions } = useDemo()
  const [moved, setMoved] = useState<number | null>(null)
  const owed = estimate.estimatedTax
  const covered = estimate.paid + estimate.setAside
  const ratio = owed > 0 ? covered / owed : 1
  const gap = Math.ceil(estimate.shortfall)
  const short = gap > 0
  const reserve = state.accounts.find((a) => a.purpose === 'tax')
  const everyday = state.accounts.find((a) => a.purpose === 'everyday') ?? state.accounts[0]
  const available = accountBalances(state, today).find((b) => b.account.id === everyday.id)?.balance ?? 0
  const move = Math.max(0, Math.min(gap, Math.floor(available)))

  function moveNow() {
    const target = reserve?.id ?? actions.openTaxReserve()
    actions.transfer(everyday.id, target, move, { note: 'Tax set-aside' })
    setMoved(move)
  }

  return (
    <section aria-labelledby="cover-title" className="flex items-start gap-5 sm:items-center">
      <Ring value={ratio} size={80} stroke={6} tone={short ? (ratio >= 0.75 ? 'warning' : 'destructive') : 'success'} label={`${pct(Math.min(ratio, 9.99))} of it is paid or set aside`} />
      <div className="space-y-3">
        <h2 id="cover-title" className="text-lg text-pretty">
          {short ? (
            <>
              <span className="font-mono font-medium text-destructive">
                <Odometer value={gap} format="usd" rollOnMount={false} />
              </span>{' '}
              of it is not paid or set aside yet.
            </>
          ) : (
            'All of it is paid or set aside.'
          )}
        </h2>
        <p className="text-[14px] text-muted-foreground">Rule of thumb: put {pct(estimate.suggestedSetAsideRate)} of every payment aside.</p>
        {moved !== null && !short ? (
          <p className="flex items-center gap-2 text-[14px]">
            <Check aria-hidden="true" className="size-4 text-success" />
            Moved {money(moved, { whole: true })} from {everyday.name} to {reserve?.name ?? 'the tax reserve'}.
          </p>
        ) : short ? (
          <div className="space-y-1.5">
            <Button onClick={moveNow} disabled={move <= 0} className="btn-ink">
              {move < gap ? `Move ${money(move, { whole: true })} to the tax reserve` : 'Move it to the tax reserve'}
            </Button>
            {move < gap && <p className="text-[12.5px] text-warning">Only {money(move, { whole: true })} is in {everyday.name} right now.</p>}
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** One line: the next payment, or the late ones, with a way to record it. */
export function NextPayment({ estimate }: { estimate: TaxEstimate }) {
  const { today } = useDemo()
  const [paying, setPaying] = useState<TaxQuarter | null>(null)
  const next = nextTaxDue(estimate)
  if (!next) return null
  const overdue = estimate.quarters.filter((q) => q.status === 'overdue')
  const days = diffDays(next.dueDate, today)
  const open = Math.max(0, next.amount - next.paid)

  return (
    <section aria-label="Next tax payment" className="flex flex-col gap-3 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className={cn('text-[15px] text-pretty', overdue.length && 'text-destructive')}>
        {overdue.length > 1
          ? `${overdue.length} quarterly payments are late. The oldest is ${next.label}.`
          : next.status === 'overdue'
            ? `${next.label} was due on ${formatDate(next.dueDate)} and is not paid yet.`
            : `Next payment: ${next.label}, about ${money(open, { whole: true })}, due in ${days} ${days === 1 ? 'day' : 'days'}.`}
      </p>
      {open > 0.5 && (
        <Button variant="outline" className="shrink-0 self-start sm:self-auto" onClick={() => setPaying(next)}>
          Record {next.label} payment
        </Button>
      )}
      <RecordPaymentDialog quarter={paying} estimate={estimate} onClose={() => setPaying(null)} onRecorded={() => setPaying(null)} />
    </section>
  )
}
