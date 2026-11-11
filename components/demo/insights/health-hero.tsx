'use client'

import { ChevronDown, Info } from 'lucide-react'
import { useState } from 'react'

import { Odometer, Stamp } from '@/components/brand'
import { RadialGauge, toneVar } from '@/components/demo/charts'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { pct } from '@/lib/demo/format'
import { useHealthScore, usePersona } from '@/lib/demo/hooks'
import type { HealthComponent } from '@/lib/demo/insights'
import { cn } from '@/lib/utils'

function formula(id: HealthComponent['id'], business: boolean): string {
  switch (id) {
    case 'savings-rate':
      return business
        ? 'Revenue left after costs, divided by revenue, over the last six complete months. A 15% margin or better scores 100; below that the score falls in a straight line to 0.'
        : 'Money kept (income minus spending) divided by income, over the last six complete months. Keeping 20% or more scores 100; below that the score falls in a straight line to 0.'
    case 'buffer':
      return `Spendable money (everyday and savings accounts, not the tax reserve) divided by average monthly costs over the last three months. ${business ? 'Three' : 'Six'} months or more scores 100.`
    case 'income-stability':
      return 'How far monthly income typically moves from its 12-month average (standard deviation ÷ average). Swings of 10% or less score 100; swings of 80% or more score 0.'
    case 'tax-readiness':
      return 'Tax already paid plus money in the tax reserve, divided by the estimated tax so far this year. Fully covered scores 100.'
    case 'budgets':
      return 'The share of your monthly budgets that stayed within their limit last month.'
    case 'receivables':
      return 'Seventy per cent from how much is overdue compared with a typical month of income, thirty per cent from how late the slowest client pays on average (45 days late scores 0).'
  }
}

const STATUS_TONE = { good: 'success', fair: 'warning', poor: 'signal' } as const
const STATUS_WORD = { good: 'Good', fair: 'Fair', poor: 'Weak' }

/** The score, its grade and a one-line verdict. The six parts sit behind "How the score is built". */
export function HealthHero() {
  const health = useHealthScore()
  const persona = usePersona()
  const business = persona.kind === 'business'
  const [open, setOpen] = useState(false)
  const sorted = [...health.components].sort((a, b) => a.score - b.score)
  const weakest = sorted.filter((c) => c.status !== 'good').slice(0, 2)
  const strongest = sorted[sorted.length - 1]
  const verdict = weakest.length
    ? `${weakest.map((c) => c.label.toLowerCase()).join(' and ')} ${weakest.length === 1 ? 'is' : 'are'} pulling it down; ${strongest.label.toLowerCase()} is the strongest part.`
    : 'Every part of the score is in good shape.'

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
    <section aria-labelledby="health-title" data-tour="health">
      <h2 id="health-title" className="sr-only">
        Financial health score
      </h2>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
        <div className="flex items-center gap-5">
          <RadialGauge value={health.score} label={`Financial health ${health.score} out of 100, grade ${health.grade}`} className="w-36 sm:w-44">
            <Odometer value={health.score} className="text-5xl font-medium tracking-tight" rollOnMount={false} />
            <span className="mt-1 text-xs text-muted-foreground">out of 100</span>
          </RadialGauge>
          <Stamp size="md" rotate={-3} tone={health.score >= 70 ? 'success' : health.score >= 45 ? 'ink' : 'signal'} subline={health.label} className="sm:hidden">
            Grade {health.grade}
          </Stamp>
        </div>
        <div className="min-w-0 max-w-xl space-y-4">
          <Stamp size="md" rotate={-3} tone={health.score >= 70 ? 'success' : health.score >= 45 ? 'ink' : 'signal'} subline={health.label} className="hidden sm:inline-flex">
            Grade {health.grade}
          </Stamp>
          <p className="font-display text-xl leading-snug font-medium text-pretty sm:text-2xl">{verdict.charAt(0).toUpperCase() + verdict.slice(1)}</p>
          <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
              How the score is built
              <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} />
          </CollapsibleTrigger>
        </div>
      </div>

        <CollapsibleContent className="pt-8">
          <p className="mb-3 max-w-2xl text-sm text-pretty text-muted-foreground">
            Six rule-based checks, weighted and added up. Every threshold is written out under the info buttons; no AI model is involved.
          </p>
          <ul className="divide-y divide-border border-y border-border">
            {health.components.map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto_2rem] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[12rem_minmax(0,1fr)_8rem_2rem]">
                <span className="min-w-0 text-sm font-medium">{c.label}</span>
                <span className="relative col-span-3 row-start-2 h-2 rounded-[2px] bg-muted sm:col-span-1 sm:col-start-2 sm:row-start-1" aria-hidden="true">
                  <span
                    className="absolute inset-y-0 left-0 rounded-[2px] transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${Math.max(1.5, c.score)}%`, backgroundColor: toneVar[STATUS_TONE[c.status]] }}
                  />
                </span>
                <span className="text-right text-sm">
                  <span className="font-mono tabular-nums">{c.display}</span>
                  <span className="sr-only">
                    , {STATUS_WORD[c.status]}, {c.score} out of 100
                  </span>
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={`How ${c.label.toLowerCase()} is calculated`}
                      className="flex size-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Info className="size-4" aria-hidden="true" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 space-y-2 text-sm">
                    <p className="font-medium">
                      {c.label} · {c.score}/100 · {STATUS_WORD[c.status].toLowerCase()}
                    </p>
                    <p className="text-muted-foreground">{c.detail}</p>
                    <p className="border-t border-border pt-2 text-[13px]">{formula(c.id, business)}</p>
                    <p className="text-xs text-muted-foreground">Counts for {pct(c.weight)} of the total score.</p>
                  </PopoverContent>
                </Popover>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
    </section>
    </Collapsible>
  )
}
