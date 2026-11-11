'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'

import { Marker, Odometer, Stamp } from '@/components/brand'
import { RadialGauge } from '@/components/demo/charts'
import { formatDate, pct } from '@/lib/demo/format'
import { useHealthScore, useKpis, usePersona, useToday, useWeakPoints } from '@/lib/demo/hooks'
import { useDemo } from '@/lib/demo/store'
import { cn } from '@/lib/utils'

import { PERIOD_WORDS, changeWords, greeting, weakPointClause } from './words'

/** Greeting, the one generated sentence, three plain figures and the health score. */
export function Situation() {
  const persona = usePersona()
  const today = useToday()
  const { state } = useDemo()
  const k = useKpis()
  const top = useWeakPoints()[0]
  const words = PERIOD_WORDS[state.period]
  const name = persona.kind === 'business' ? persona.name : persona.name.split(' ')[0]
  const hello = useMemo(() => greeting(), [])
  const isBusiness = persona.kind === 'business'
  const kept = k.income > 0 && k.net >= 0

  return (
    <section aria-labelledby="overview-greeting" className="space-y-12">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="min-w-0 lg:col-span-9">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{formatDate(today, { weekday: true })}</p>
          <h1 id="overview-greeting" className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {hello}, {name}.
          </h1>
          <p data-tour="overview-summary" className="mt-5 max-w-3xl font-display text-xl leading-snug font-medium text-pretty sm:text-[1.75rem] sm:leading-[1.3]">
            {k.income <= 0
              ? `Nothing has come in ${words.inPeriod} yet`
              : kept
                ? `${isBusiness ? persona.name : 'You'} kept ${pct(k.savingsRate)} of what came in ${words.inPeriod}`
                : `${isBusiness ? persona.name : 'You'} spent more than came in ${words.inPeriod}`}
            {top ? (
              <>
                {kept ? ', but ' : ', and '}
                <Marker variant="underline" color="signal">
                  {weakPointClause(top)}
                </Marker>
                .
              </>
            ) : (
              '. Nothing urgent needs fixing.'
            )}
          </p>
        </div>
        <HealthCompact data-tour-avoid="" className="hidden lg:col-span-3 lg:flex" />
      </div>

      <dl data-tour-avoid="" className="grid grid-cols-3 gap-4 sm:gap-10">
        <Figure label={isBusiness ? 'Took in' : 'Earned'} value={k.income} note={changeWords(k.income, k.previous.income, state.period)} tone="success" />
        <Figure label="Spent" value={k.expenses} note={changeWords(k.expenses, k.previous.expenses, state.period)} />
        <Figure
          label={k.net >= 0 ? 'Kept' : 'Overspent'}
          value={Math.abs(k.net)}
          note={changeWords(k.net, k.previous.net, state.period)}
          tone={k.net < 0 ? 'signal' : undefined}
        />
      </dl>
    </section>
  )
}

function Figure({ label, value, note, tone }: { label: string; value: number; note: string; tone?: 'success' | 'signal' }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 text-2xl font-medium tracking-tight sm:text-4xl', tone === 'success' && 'text-success', tone === 'signal' && 'text-destructive')}>
        <Odometer value={Math.round(value)} format="usd" rollOnMount={false} />
      </dd>
      <dd className="mt-1 hidden text-xs text-muted-foreground sm:block">{note}</dd>
    </div>
  )
}

/** Score, grade and a link to Insights. Rendered once per breakpoint: in the hero on desktop, under the chart on phones. */
export function HealthCompact({ className, ...rest }: { className?: string; 'data-tour-avoid'?: string }) {
  const health = useHealthScore()
  return (
    <Link
      {...rest}
      href="/demo/insights"
      aria-label={`Financial health ${health.score} out of 100, grade ${health.grade}, ${health.label}. See what is behind it.`}
      className={cn('group flex items-center gap-4 rounded-md p-1 lg:flex-col lg:items-start lg:gap-2', className)}
    >
      <RadialGauge value={health.score} ticks={false} className="w-20 shrink-0 sm:w-24">
        <Odometer value={health.score} className="text-2xl font-medium" rollOnMount={false} />
      </RadialGauge>
      <span className="min-w-0 space-y-1.5">
        <span className="block text-sm text-muted-foreground">Financial health</span>
        <Stamp size="sm" rotate={-2} tone={health.score >= 70 ? 'success' : health.score >= 45 ? 'ink' : 'signal'} still>
          Grade {health.grade} · {health.label}
        </Stamp>
        <span className="flex items-center gap-1 text-sm font-medium underline-offset-4 group-hover:underline">
          What is behind it <ArrowRight aria-hidden="true" className="size-3.5" />
        </span>
      </span>
    </Link>
  )
}
