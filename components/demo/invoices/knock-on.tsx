'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Odometer } from '@/components/brand'
import { kpis, liquidBalance, PERIODS } from '@/lib/demo/analytics'
import { money, signedMoney } from '@/lib/demo/format'
import { healthScore } from '@/lib/demo/insights'
import { receivablesSummary } from '@/lib/demo/invoices'
import { estimateTax } from '@/lib/demo/tax'
import type { DemoState, ISODate } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

/** The numbers other pages show, taken at one moment so a change can be shown as before → after. */
export interface Snapshot {
  periodLabel: string
  income: number
  estimatedTax: number
  shortfall: number
  setAside: number
  suggestedRate: number
  health: number
  outstanding: number
  overdueCount: number
  liquid: number
}

export function takeSnapshot(state: DemoState, today: ISODate): Snapshot {
  const year = Number(today.slice(0, 4))
  const tax = estimateTax(state, year, today)
  const recv = receivablesSummary(state.invoices, today)
  return {
    periodLabel: PERIODS.find((p) => p.id === state.period)?.label ?? 'This period',
    income: kpis(state, state.period, today).income,
    estimatedTax: tax.estimatedTax,
    shortfall: tax.shortfall,
    setAside: tax.setAside,
    suggestedRate: tax.suggestedSetAsideRate,
    health: healthScore(state, today).score,
    outstanding: recv.outstanding,
    overdueCount: recv.overdueCount,
    liquid: liquidBalance(state, today),
  }
}

export interface Change {
  label: ReactNode
  before: number
  after: number
  kind?: 'usd' | 'number'
  /** Which direction is good news (colours the delta). */
  goodWhen?: 'up' | 'down' | 'neutral'
  href?: string
  hrefLabel?: string
}

/** One line of a before → after receipt: old figure struck through, new one rolling into place. */
export function ChangeRow({ label, before, after, kind = 'usd', goodWhen = 'up', href, hrefLabel }: Change) {
  const delta = after - before
  const moved = Math.abs(delta) >= (kind === 'usd' ? 0.5 : 0.5)
  const good = moved && (goodWhen === 'up' ? delta > 0 : delta < 0)
  const fmt = (v: number) => (kind === 'usd' ? money(v, { whole: true }) : String(Math.round(v)))
  return (
    <li className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-0.5 py-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
      <span className="min-w-0 text-[13px]">
        {href ? (
          <Link href={href} className="group inline-flex items-center gap-1 underline decoration-border underline-offset-4 hover:decoration-foreground">
            {label}
            <ArrowUpRight aria-hidden="true" className="size-3 text-muted-foreground group-hover:text-foreground" />
            {hrefLabel && <span className="sr-only">({hrefLabel})</span>}
          </Link>
        ) : (
          label
        )}
      </span>
      <span className="flex items-baseline justify-end gap-1.5 font-mono text-[13px] tabular-nums">
        <s className={cn('text-muted-foreground decoration-1', !moved && 'no-underline')}>{fmt(before)}</s>
        <ArrowRight aria-hidden="true" className="size-3 self-center text-muted-foreground" />
        <span className="sr-only">now</span>
        {kind === 'usd' ? <Odometer value={Math.round(after)} format="usd" className="font-medium" rollOnMount={false} /> : <Odometer value={Math.round(after)} className="font-medium" rollOnMount={false} />}
      </span>
      <span
        className={cn(
          'col-start-2 text-right font-mono text-[12px] tabular-nums sm:col-start-auto sm:w-20',
          !moved || goodWhen === 'neutral' ? 'text-muted-foreground' : good ? 'text-success' : 'text-destructive',
        )}
      >
        {!moved ? 'no change' : kind === 'usd' ? signedMoney(delta, { whole: true }) : `${delta > 0 ? '+' : '−'}${Math.abs(Math.round(delta))}`}
      </span>
    </li>
  )
}

export function ChangeList({ changes, className }: { changes: Change[]; className?: string }) {
  return (
    <ul className={cn('divide-y divide-dashed divide-border', className)}>
      {changes.map((c, i) => (
        <ChangeRow key={i} {...c} />
      ))}
    </ul>
  )
}
