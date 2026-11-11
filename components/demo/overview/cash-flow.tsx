'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, XAxis, YAxis } from 'recharts'

import { ChartLegendKeys, ChartSummary, axisTick, gridProps } from '@/components/demo/charts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { useMonthlySeries } from '@/lib/demo/hooks'
import { formatMonth, money, moneyCompact, signedMoney } from '@/lib/demo/format'
import { cn } from '@/lib/utils'

const config: ChartConfig = {
  income: { label: 'Money in', color: 'var(--success)' },
  expenses: { label: 'Money out', color: 'var(--muted-foreground)' },
  net: { label: 'Net', color: 'var(--foreground)' },
}

interface ChartState {
  activeTooltipIndex?: number
}

/**
 * Twelve months of money in and out. Pointing at (or tabbing to) a month adds
 * the net line and that month's numbers; click or Enter opens its transactions.
 */
export function CashFlow({ className }: { className?: string }) {
  const router = useRouter()
  const series = useMonthlySeries(12)
  const last = series.length - 1
  const [active, setActive] = useState<number | null>(null)
  const point = active === null ? null : series[Math.min(active, last)]
  const negatives = series.filter((m) => m.net < 0).length
  const worst = series.reduce((a, b) => (b.net < a.net ? b : a), series[0])
  const totalIn = series.reduce((s, m) => s + m.income, 0)
  const totalOut = series.reduce((s, m) => s + m.expenses, 0)
  const open = (i: number) => router.push(`/demo/transactions?month=${series[i].month}`)

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = active ?? last
    if (e.key === 'ArrowRight') setActive(Math.min(last, i + 1))
    else if (e.key === 'ArrowLeft') setActive(Math.max(0, i - 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Enter' || e.key === ' ') open(i)
    else if (e.key === 'Escape') setActive(null)
    else return
    e.preventDefault()
  }

  return (
    <section aria-labelledby="cashflow-title" className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="cashflow-title" className="font-display text-xl font-semibold tracking-tight">
          Money in and out, month by month
        </h2>
        <ChartLegendKeys
          items={[
            { label: 'In', color: 'var(--success)' },
            { label: 'Out', color: 'var(--muted-foreground)' },
            ...(point ? [{ label: 'Net', color: 'var(--foreground)', line: true }] : []),
          ]}
        />
      </div>
      <div
        role="group"
        tabIndex={0}
        aria-label="Cash-flow chart. Left and right arrows pick a month; Enter opens that month's transactions."
        onKeyDown={onKey}
        onFocus={() => setActive((a) => a ?? last)}
        onBlur={() => setActive(null)}
        className="mt-4 rounded-sm [--cf-sel:color-mix(in_oklab,var(--lime)_50%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 dark:[--cf-sel:color-mix(in_oklab,var(--lime)_20%,transparent)]"
      >
        <ChartContainer config={config} className="aspect-auto h-56 w-full sm:h-64 [&_.recharts-surface]:cursor-pointer">
          <ComposedChart
            data={series}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
            barGap={2}
            onMouseMove={(s: ChartState) => {
              if (typeof s?.activeTooltipIndex === 'number') setActive(s.activeTooltipIndex)
            }}
            onMouseLeave={() => setActive(null)}
            onClick={(s: ChartState) => {
              if (typeof s?.activeTooltipIndex === 'number') open(s.activeTooltipIndex)
            }}
          >
            <CartesianGrid {...gridProps} />
            {point && <ReferenceArea x1={point.label} x2={point.label} fill="var(--cf-sel)" fillOpacity={1} ifOverflow="visible" />}
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: 'var(--border-strong)' }}
              tick={axisTick}
              interval="preserveEnd"
              minTickGap={4}
              tickMargin={6}
              tickFormatter={(v: string, i: number) => (i === last ? `${v}*` : v)}
            />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} width={46} tickFormatter={(v: number) => moneyCompact(v)} />
            <ReferenceLine y={0} stroke="var(--border-strong)" strokeOpacity={0.5} />
            <Bar dataKey="income" fill="var(--color-income)" radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive={false} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive={false} />
            {/* Always in the chart so the scale does not jump; only visible once a month is picked. */}
            <Line
              dataKey="net"
              type="linear"
              stroke={point ? 'var(--color-net)' : 'transparent'}
              strokeWidth={2}
              dot={point ? { r: 3, fill: 'var(--foreground)', stroke: 'var(--background)', strokeWidth: 2 } : false}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
      <p aria-live="polite" className="mt-3 min-h-6 text-sm text-pretty">
        {point ? (
          <>
            <span className="font-medium">{formatMonth(point.month, { long: true, year: false })}</span>
            {point.month === series[last].month && ' so far'}: in <span className="font-mono tabular-nums">{money(point.income, { whole: true })}</span>, out{' '}
            <span className="font-mono tabular-nums">{money(point.expenses, { whole: true })}</span>, net{' '}
            <span className={cn('font-mono tabular-nums', point.net < 0 && 'text-destructive')}>{signedMoney(point.net, { whole: true })}</span>.{' '}
            <Link href={`/demo/transactions?month=${point.month}`} className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline">
              See its transactions <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </>
        ) : (
          <span className="text-muted-foreground">Point at a month to see its numbers; click it to open its transactions. * this month so far.</span>
        )}
      </p>
      <ChartSummary>
        Over the last 12 months {money(totalIn, { whole: true })} came in and {money(totalOut, { whole: true })} went out. Spending was higher than income in {negatives}{' '}
        {negatives === 1 ? 'month' : 'months'}; the weakest was {formatMonth(worst.month, { long: true })} ({signedMoney(worst.net, { whole: true })}).
      </ChartSummary>
    </section>
  )
}
