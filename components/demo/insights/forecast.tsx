'use client'

import { ChevronDown, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CartesianGrid, ComposedChart, Line, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartLegendKeys, ChartSummary, MoneyTooltip, axisTick, gridProps } from '@/components/demo/charts'
import { Button } from '@/components/ui/button'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Slider } from '@/components/ui/slider'
import { liquidBalance } from '@/lib/demo/analytics'
import { addDays, addMonthsToKey, endOfMonth, monthKey } from '@/lib/demo/dates'
import { formatDate, formatMonth, formatMonths, money, moneyCompact, signedPct } from '@/lib/demo/format'
import { useForecast, useToday } from '@/lib/demo/hooks'
import { useDemo } from '@/lib/demo/store'
import { cn } from '@/lib/utils'

const MONTHS = 6

const config: ChartConfig = {
  actual: { label: 'Balance', color: 'var(--foreground)' },
  projected: { label: 'Projected', color: 'var(--foreground)' },
}

function niceTicks(min: number, max: number): number[] {
  const span = Math.max(1, max - min)
  const raw = span / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let v = Math.floor(min / step) * step; v <= Math.ceil(max / step) * step + step / 2; v += step) out.push(Math.round(v))
  return out
}

function Control({ id, label, value, children }: { id: string; label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm">
          {label}
        </label>
        <span className="font-mono text-sm tabular-nums">{value}</span>
      </div>
      {children}
    </div>
  )
}

/** Where the spendable balance is heading at the recent pace, with an optional what-if. */
export function ForecastSimulator() {
  const { state } = useDemo()
  const today = useToday()
  const [open, setOpen] = useState(false)
  const [income, setIncome] = useState(0)
  const [cost, setCost] = useState(0)
  const [oneOff, setOneOff] = useState(0)
  const fc = useForecast(MONTHS, { incomeChangePct: income / 100, extraMonthlyCost: cost })
  const changed = income !== 0 || cost !== 0 || oneOff !== 0

  const data = useMemo(() => {
    const thisMonth = monthKey(today)
    const rows: Record<string, unknown>[] = [-5, -4, -3, -2, -1].map((i) => {
      const m = addMonthsToKey(thisMonth, i)
      return { label: formatMonth(m, { year: false }), actual: liquidBalance(state, endOfMonth(`${m}-01`)) }
    })
    rows.push({ label: 'Now', actual: fc.startBalance, projected: fc.startBalance - oneOff })
    for (const p of fc.points) rows.push({ label: formatMonth(p.month, { year: false }), projected: p.balance - oneOff })
    return rows
  }, [state, today, fc, oneOff])

  const ticks = useMemo(() => {
    const values = data.flatMap((d) => [d.actual, d.projected]).filter((v): v is number => typeof v === 'number')
    return niceTicks(Math.min(0, ...values), Math.max(0, ...values))
  }, [data])

  const start = fc.startBalance - oneOff
  const end = fc.endBalance - oneOff
  const runway = start <= 0 ? 0 : fc.monthlyNet < 0 ? start / -fc.monthlyNet : null
  const zeroDate = runway !== null ? addDays(today, Math.round(runway * 30.4)) : null
  const runwayText = runway === null ? '' : runway > 24 ? `${(runway / 12).toFixed(1)} years` : formatMonths(runway)

  const sentence =
    runway === null ? (
      <>
        At the recent pace your spendable money grows by <span className="font-mono tabular-nums">{money(fc.monthlyNet, { whole: true })}</span> a month. It does not run out.
      </>
    ) : runway <= 0 ? (
      <>That purchase alone would use up all your spendable money.</>
    ) : (
      <>
        At the recent pace your spendable money shrinks every month and would{' '}
        <span className="text-destructive">
          run out in about {runwayText}, around {formatDate(zeroDate!, { year: true })}
        </span>
        .
      </>
    )

  return (
    <div>
      <p aria-live="polite" className="max-w-3xl text-lg text-pretty">
        {sentence}
      </p>
      <ChartLegendKeys
        className="mt-6"
        items={[
          { label: 'Balance so far', color: 'var(--foreground)', line: true },
          { label: 'Projected', color: 'var(--foreground)', line: true, dashed: true },
        ]}
      />
      <ChartContainer config={config} className="mt-3 aspect-auto h-56 w-full sm:h-64">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--border-strong)' }} tick={axisTick} tickMargin={6} interval="preserveEnd" minTickGap={4} />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} width={48} ticks={ticks} domain={[ticks[0], ticks[ticks.length - 1]]} tickFormatter={(v: number) => moneyCompact(v)} />
          <ReferenceLine y={0} stroke="var(--destructive)" strokeWidth={1.5} />
          <Line dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="projected" stroke="var(--color-projected)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          <Tooltip
            cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            content={
              <MoneyTooltip
                format={(n) => money(n, { whole: true })}
                series={{ actual: { label: 'Balance', color: 'var(--foreground)', line: true }, projected: { label: 'Projected', color: 'var(--foreground)', line: true } }}
              />
            }
          />
        </ComposedChart>
      </ChartContainer>
      <ChartSummary>
        Spendable balance now {money(fc.startBalance, { whole: true })}; projected {money(end, { whole: true })} in {MONTHS} months.
      </ChartSummary>

      <Collapsible open={open} onOpenChange={setOpen} className="mt-6">
        <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
          Try a scenario
          <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 grid max-w-3xl gap-6 sm:grid-cols-3">
            <Control id="fc-income" label="Income changes by" value={signedPct(income / 100)}>
              <Slider id="fc-income" min={-50} max={50} step={5} value={[income]} onValueChange={([v]) => setIncome(v)} aria-label="Income change in per cent" />
            </Control>
            <Control id="fc-cost" label="New monthly cost" value={money(cost, { whole: true })}>
              <Slider id="fc-cost" min={0} max={1000} step={25} value={[cost]} onValueChange={([v]) => setCost(v)} aria-label="New monthly cost in dollars" />
            </Control>
            <Control id="fc-oneoff" label="One-off purchase now" value={money(oneOff, { whole: true })}>
              <Slider id="fc-oneoff" min={0} max={10000} step={100} value={[oneOff]} onValueChange={([v]) => setOneOff(v)} aria-label="One-off purchase in dollars" />
            </Control>
          </div>
          <Button size="sm" variant="outline" onClick={() => (setIncome(0), setCost(0), setOneOff(0))} disabled={!changed} className="mt-5 gap-1.5">
            <RotateCcw aria-hidden="true" />
            Reset scenario
          </Button>
          <p className="mt-3 max-w-3xl text-xs text-pretty text-muted-foreground">
            Based on the average of the last six complete months. Simple on purpose: no seasonality, no one-offs.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
