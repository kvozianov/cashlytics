'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartLegendKeys, ChartSummary, MoneyTooltip, SegmentBar, axisTick, gridProps } from '@/components/demo/charts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { flowOf } from '@/lib/demo/analytics'
import { getCategory } from '@/lib/demo/categories'
import { diffDays } from '@/lib/demo/dates'
import { formatMonth, money, moneyCompact, pct } from '@/lib/demo/format'
import { useDemoState, useMonthlySeries, useToday } from '@/lib/demo/hooks'
import { invoiceTotal } from '@/lib/demo/invoices'

const config: ChartConfig = { income: { label: 'Income', color: 'var(--success)' } }
const SOURCE_COLORS = ['var(--cat-3)', 'var(--cat-1)', 'var(--cat-4)', 'var(--cat-5)', 'var(--cat-6)', 'var(--muted-foreground)']

/** How much income swings from month to month, and how much depends on one source. */
export function IncomeStability({ className }: { className?: string }) {
  const state = useDemoState()
  const today = useToday()
  const series = useMonthlySeries(13).slice(0, 12)
  const values = series.map((m) => m.income)
  const avg = values.reduce((s, v) => s + v, 0) / (values.length || 1)
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length || 1))
  const cv = avg > 0 ? sd / avg : 0
  const low = series.reduce((a, b) => (b.income < a.income ? b : a), series[0])
  const high = series.reduce((a, b) => (b.income > a.income ? b : a), series[0])

  const sources = useMemo(() => {
    const map = new Map<string, number>()
    const invoiceTx = new Set<string>()
    for (const inv of state.invoices) {
      if (inv.status !== 'paid' || !inv.paidDate || diffDays(today, inv.paidDate) > 365) continue
      if (inv.transactionId) invoiceTx.add(inv.transactionId)
      const name = state.clients.find((c) => c.id === inv.clientId)?.name ?? 'Client'
      map.set(name, (map.get(name) ?? 0) + invoiceTotal(inv))
    }
    for (const t of state.transactions) {
      if (diffDays(today, t.date) > 365 || invoiceTx.has(t.id) || t.invoiceId) continue
      const income = flowOf(t).income
      if (income <= 0) continue
      const label = getCategory(t.categoryId).label
      map.set(label, (map.get(label) ?? 0) + income)
    }
    const list = [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    const head = list.slice(0, 5)
    const rest = list.slice(5).reduce((s, x) => s + x.value, 0)
    if (rest > 0) head.push({ label: 'Other', value: rest })
    const total = list.reduce((s, x) => s + x.value, 0)
    return { list: head.map((x, i) => ({ ...x, key: x.label, color: SOURCE_COLORS[i] })), total }
  }, [state, today])

  const top = sources.list[0]
  const topShare = top && sources.total > 0 ? top.value / sources.total : 0

  return (
    <div className={className}>
      <p className="max-w-3xl text-lg text-pretty">
        Your income moves about ±{pct(cv)} from month to month.{' '}
        {top &&
          `${top.label} brought in ${pct(topShare)} of the last year's income${topShare >= 0.5 ? ', so losing that one source would hurt.' : topShare >= 0.3 ? ', a big share worth keeping an eye on.' : '.'}`}
      </p>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="min-w-0">
          <ChartLegendKeys
            className="mb-2"
            items={[
              { label: 'Income per month', color: 'var(--success)' },
              { label: 'Average', color: 'var(--foreground)', line: true },
            ]}
          />
          <ChartContainer config={config} className="aspect-auto h-44 w-full">
            <BarChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--border-strong)' }} tick={axisTick} interval="preserveEnd" minTickGap={4} tickMargin={6} />
              <YAxis tickLine={false} axisLine={false} tick={axisTick} width={44} tickFormatter={(v: number) => moneyCompact(v)} />
              <ReferenceLine y={avg} stroke="var(--foreground)" strokeWidth={1} />
              <Bar dataKey="income" fill="var(--color-income)" radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false} />
              <Tooltip cursor={{ fill: 'var(--muted)' }} content={<MoneyTooltip format={(n) => money(n, { whole: true })} series={{ income: { label: 'Income', color: 'var(--success)' } }} />} />
            </BarChart>
          </ChartContainer>
          <ChartSummary>
            Over the last 12 complete months income averaged {money(avg, { whole: true })}, lowest in {formatMonth(low.month, { long: true })} ({money(low.income, { whole: true })}) and highest in{' '}
            {formatMonth(high.month, { long: true })} ({money(high.income, { whole: true })}).
          </ChartSummary>
        </div>
        {sources.list.length > 0 && (
          <div className="min-w-0 space-y-3">
            <p className="text-sm text-muted-foreground">Where it came from, last 12 months</p>
            <SegmentBar segments={sources.list} label="Income by source, last 12 months" heightClassName="h-3" format={(n) => money(n, { whole: true })} />
            <ul className="space-y-1">
              {sources.list.slice(0, 4).map((s) => (
                <li key={s.key} className="flex items-baseline gap-2 text-sm">
                  <span aria-hidden="true" className="size-2.5 shrink-0 self-center rounded-[2px]" style={{ backgroundColor: s.color }} />
                  <span className="min-w-0 truncate">{s.label}</span>
                  <span aria-hidden="true" className="ldr-leader min-w-3" />
                  <span className="font-mono tabular-nums">{pct(s.value / sources.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
