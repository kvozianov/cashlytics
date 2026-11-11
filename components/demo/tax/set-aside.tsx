'use client'

import { ArrowRight } from 'lucide-react'

import { formatDate, money, pct } from '@/lib/demo/format'
import { useDemo } from '@/lib/demo/store'
import type { TaxEstimate } from '@/lib/demo/tax'
import { cn } from '@/lib/utils'

import { recentTaxableIncome } from './model'

/** Why the set-aside share is what it is, and what each recent payment should have put aside. */
export function SetAside({ estimate }: { estimate: TaxEstimate }) {
  const { state, today } = useDemo()
  const rate = estimate.suggestedSetAsideRate
  const current = estimate.currentSetAsideRate
  const recent = recentTaxableIncome(state.transactions, estimate.year, today)

  return (
    <div id="set-aside" className="grid scroll-mt-40 grid-cols-[minmax(0,1fr)] gap-10 sm:scroll-mt-28 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance">Put {pct(rate)} of every payment aside.</p>
        <p className="text-[14px] text-pretty text-muted-foreground">
          That is the tax expected for {estimate.year} ({money(estimate.projectedAnnualTax, { whole: true })}) divided by the income expected (
          {money(estimate.projectedTaxableIncome, { whole: true })}), rounded up. Costs lower the tax, so the share sits below the headline rate.
        </p>
        <p className="text-[14px] text-pretty">
          Over the last 12 months you moved <span className={cn('font-mono', current + 0.005 < rate ? 'text-destructive' : 'text-success')}>{pct(current)}</span>.{' '}
          {current + 0.005 < rate ? 'That is why the reserve falls behind.' : 'That keeps pace with the tax.'}
        </p>
      </div>
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Recent payments and what to put aside from each</p>
        {recent.length === 0 ? (
          <p className="text-[14px] text-muted-foreground">No taxable income this year yet.</p>
        ) : (
          <ul className="divide-y divide-dashed divide-border text-[14px]">
            {recent.map((t) => (
              <li key={t.id} className="flex items-baseline gap-3 py-2">
                <span className="hidden w-14 shrink-0 font-mono text-[12px] text-muted-foreground tabular-nums sm:inline">{formatDate(t.date, { year: false })}</span>
                <span className="min-w-0 flex-1 truncate">{t.merchant}</span>
                <span className="shrink-0 font-mono text-muted-foreground tabular-nums">{money(t.amount, { whole: true })}</span>
                <ArrowRight aria-hidden="true" className="size-3 shrink-0 self-center text-muted-foreground" />
                <span className="w-14 shrink-0 text-right font-mono font-medium tabular-nums">
                  <span className="sr-only">set aside </span>
                  {money(t.amount * rate, { whole: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
