'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import { MarginNote } from '@/components/brand'
import { money, pct } from '@/lib/demo/format'
import { useDemo } from '@/lib/demo/store'
import { cn } from '@/lib/utils'

import { needsWantsSplit } from './model'

const PARTS = [
  { id: 'needs', label: 'Needs', target: 0.5, tone: 'bg-foreground', text: 'text-background', hint: 'Rent, bills, groceries, transport, insurance, loan payments' },
  { id: 'wants', label: 'Wants', target: 0.3, tone: 'bg-cat-5', text: 'text-ink', hint: 'Eating out, shopping, subscriptions, trips' },
  { id: 'saved', label: 'Left to save', target: 0.2, tone: 'bg-success', text: 'text-background', hint: 'Income minus everything spent' },
] as const

const BUSINESS_HINT = {
  needs: 'Stock, payroll, the stall lease, insurance, the loan',
  wants: 'Marketing, software, equipment, fees',
  saved: 'Profit kept after all costs',
} as const

/** The persona's real spending laid over the 50/30/20 rule of thumb. */
export function FiftyThirtyTwenty() {
  const { state, today, persona } = useDemo()
  const split = useMemo(() => needsWantsSplit(state, today), [state, today])
  const business = persona.kind === 'business'
  const [open, setOpen] = useState(false)

  if (split.income <= 0) {
    return null
  }
  const share = { needs: split.needs / split.income, wants: split.wants / split.income, saved: Math.max(0, split.saved) / split.income }
  const overspent = split.saved < 0
  const worst = PARTS.map((p) => ({ ...p, gap: p.id === 'saved' ? p.target - share.saved : share[p.id] - p.target })).sort((a, b) => b.gap - a.gap)[0]

  return (
    <section aria-labelledby="split-title" className="rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <h2 id="split-title" className="text-[15px] font-medium">
          <button type="button" aria-expanded={open} aria-controls="split-body" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-left hover:underline">
            How your spending splits: the 50 / 30 / 20 check
            <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform', open && 'rotate-180')} />
          </button>
        </h2>
        {open && (
          <Link href="/demo/learn?lesson=budget-50-30-20" className="text-[13px] underline underline-offset-4">
            Two-minute lesson
          </Link>
        )}
      </div>
      {open && (
      <div id="split-body" className="space-y-4 border-t border-border p-4 sm:p-6">
        <p className="text-[13px] text-muted-foreground">
          {business
            ? 'A personal-budget rule of thumb; for the kiosk read it as essential costs, other costs and what is kept.'
            : 'A starting point, not a law: half for needs, under a third for wants, a fifth or more saved.'}
        </p>
        <div>
          <div className="mb-1 flex justify-between font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            <span>You, last 3 months</span>
            <span>{money(split.income, { whole: true })} / month in</span>
          </div>
          <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded-[3px]" role="img" aria-label={PARTS.map((p) => `${p.label} ${pct(share[p.id])}`).join(', ')}>
            {PARTS.map((p) =>
              share[p.id] > 0 ? (
                <div key={p.id} className={cn('flex items-center px-2 font-mono text-[11px] tabular-nums', p.tone, p.text)} style={{ flexGrow: share[p.id], flexBasis: 0 }}>
                  {share[p.id] >= 0.08 && pct(share[p.id])}
                </div>
              ) : null,
            )}
          </div>
          <div className="mt-2 mb-1 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Rule of thumb</div>
          <div className="flex h-2 w-full gap-[2px]" aria-hidden="true">
            {PARTS.map((p) => (
              <div key={p.id} className={cn('rounded-[1px] opacity-35', p.tone)} style={{ flexGrow: p.target, flexBasis: 0 }} />
            ))}
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          {PARTS.map((p) => {
            const amount = p.id === 'saved' ? split.saved : split[p.id]
            const off = p.id === 'saved' ? share.saved < p.target - 0.02 : share[p.id] > p.target + 0.02
            return (
              <div key={p.id} className="border-l-2 border-border pl-3">
                <dt className="flex items-center gap-1.5 text-[13px] font-medium">
                  <span aria-hidden="true" className={cn('size-2.5 rounded-[2px]', p.tone)} />
                  {p.label}
                  <span className="font-normal text-muted-foreground">· aim {pct(p.target)}</span>
                </dt>
                <dd className={cn('font-mono text-lg tabular-nums', off && 'text-destructive')}>
                  {pct(p.id === 'saved' && overspent ? split.saved / split.income : share[p.id])}
                  <span className="ml-2 text-[13px] text-muted-foreground">{money(amount, { whole: true })}</span>
                </dd>
                <dd className="text-[12px] text-muted-foreground">{business ? BUSINESS_HINT[p.id] : p.hint}</dd>
              </div>
            )
          })}
        </dl>
        {worst.gap > 0.03 && (
          <MarginNote arrow="up" tone="signal" size="sm" rotate={-1.5}>
            {worst.id === 'saved'
              ? overspent
                ? 'spending more than comes in. Trim the biggest want first.'
                : `saving ${pct(share.saved)}; the rule says ${pct(worst.target)}.`
              : `${worst.label.toLowerCase()} take ${pct(share[worst.id])}; the rule says ${pct(worst.target)}.`}
          </MarginNote>
        )}
      </div>
      )}
    </section>
  )
}
