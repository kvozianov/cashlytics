'use client'

import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'

import { Odometer } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { money, moneyCompact, signedMoney, signedPct } from '@/lib/demo/format'
import { useDemo } from '@/lib/demo/store'
import { whatIf, type TaxEstimate } from '@/lib/demo/tax'
import type { TaxSettings } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { Slider } from '@/components/ui/slider'
import { cumulativeSeries, type CumulativePoint } from './model'

const config = {
  tax: { label: 'Tax owed', color: 'var(--foreground)' },
  covered: { label: 'Paid + reserve', color: 'var(--cat-6)' },
} satisfies ChartConfig

/** Sliders for the rest of the year, the new estimate, and tax owed vs covered month by month. */
export function WhatIf({ estimate, settings }: { estimate: TaxEstimate; settings: TaxSettings }) {
  const { state, today } = useDemo()
  const [incomePct, setIncomePct] = useState(0)
  const [extra, setExtra] = useState(0)

  const result = useMemo(() => whatIf(estimate, settings, { incomeDeltaPct: incomePct / 100, extraDeductible: extra }), [estimate, settings, incomePct, extra])
  const series = useMemo(() => cumulativeSeries(state, settings, estimate, result, today), [state, settings, estimate, result, today])
  const end = series[series.length - 1]
  const yearEndGap = (end.coveredProjected ?? end.coveredActual ?? 0) - (end.taxProjected ?? end.taxActual ?? 0)
  const currentLabel = series.find((p) => p.taxActual !== null && p.taxProjected !== null)?.label
  const changed = incomePct !== 0 || extra !== 0
  const savedByExtra = useMemo(
    () => Math.max(0, whatIf(estimate, settings, { incomeDeltaPct: incomePct / 100 }).projectedAnnualTax - result.projectedAnnualTax),
    [estimate, settings, incomePct, result],
  )

  return (
    <section aria-labelledby="whatif-title" className="@container rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div>
          <h2 id="whatif-title" className="text-sm font-semibold tracking-tight">
            What if…
          </h2>
          <p className="text-[13px] text-muted-foreground">Try a change for the rest of the year. Nothing here is saved.</p>
        </div>
        {changed && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIncomePct(0)
              setExtra(0)
            }}
          >
            Reset
          </Button>
        )}
      </div>
      <div className="grid gap-8 p-4 sm:p-6 @2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">Income for the rest of the year</p>
              <span className="font-mono text-sm tabular-nums">{signedPct(incomePct / 100)}</span>
            </div>
            <Slider aria-label="Income for the rest of the year, change" aria-valuetext={`${incomePct > 0 ? "plus " : incomePct < 0 ? "minus " : ""}${Math.abs(incomePct)} percent`} min={-50} max={50} step={5} value={[incomePct]} onValueChange={([v]) => setIncomePct(v)} />
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground" aria-hidden="true">
              <span>−50%</span>
              <span>0</span>
              <span>+50%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">Extra deductible purchase</p>
              <span className="font-mono text-sm tabular-nums">{money(extra, { whole: true })}</span>
            </div>
            <Slider aria-label="Extra deductible purchase" aria-valuetext={money(extra, { whole: true })} min={0} max={10_000} step={250} value={[extra]} onValueChange={([v]) => setExtra(v)} />
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground" aria-hidden="true">
              <span>$0</span>
              <span>$10,000</span>
            </div>
          </div>

          <dl className="space-y-1.5 border-t border-foreground/70 pt-4 text-[13.5px]">
            <div className="flex items-baseline gap-2">
              <dt>Full-year tax, as things are</dt>
              <span aria-hidden="true" className="ldr-leader" />
              <dd className="font-mono tabular-nums">{money(estimate.projectedAnnualTax, { whole: true })}</dd>
            </div>
            <div className="flex items-baseline gap-2 font-medium">
              <dt>With your changes</dt>
              <span aria-hidden="true" className="ldr-leader" />
              <dd className="font-mono text-lg tabular-nums">
                <Odometer value={Math.round(result.projectedAnnualTax)} format="usd" rollOnMount={false} />
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">Difference</dt>
              <span aria-hidden="true" className="ldr-leader" />
              <dd className={cn('font-mono tabular-nums', result.delta > 0.5 ? 'text-destructive' : result.delta < -0.5 ? 'text-success' : 'text-muted-foreground')}>
                {Math.abs(result.delta) < 0.5 ? 'none' : signedMoney(result.delta, { whole: true })}
              </dd>
            </div>
          </dl>
          {extra > 0 && (
            <p className="text-[12.5px] text-pretty text-muted-foreground">
              Spending {money(extra, { whole: true })} saves about {money(savedByExtra, { whole: true })} of tax, so you are still{' '}
              {money(extra - savedByExtra, { whole: true })} poorer. Buy it only if the work needs it.
            </p>
          )}
        </div>

        <figure className="min-w-0">
          <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-4 bg-foreground" />
              Tax owed so far
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-4 bg-cat-6" />
              Paid + in reserve
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span aria-hidden="true" className="w-4 border-t-2 border-dashed border-muted-foreground" />
              projected
            </span>
          </figcaption>
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" className="font-mono" fontSize={11} />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => moneyCompact(v)} className="font-mono" fontSize={11} />
              {currentLabel && <ReferenceLine x={currentLabel} stroke="var(--border-strong)" strokeDasharray="2 3" label={{ value: 'today', position: 'insideTopRight', fontSize: 10, fill: 'var(--muted-foreground)' }} />}
              <ChartTooltip cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} content={<SeriesTooltip />} />
              <Line dataKey="taxActual" stroke="var(--color-tax)" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
              <Line dataKey="taxProjected" stroke="var(--color-tax)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
              <Line dataKey="coveredActual" stroke="var(--color-covered)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line dataKey="coveredProjected" stroke="var(--color-covered)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
          <p className={cn('mt-2 text-[12.5px]', yearEndGap < 0 ? 'text-destructive' : 'text-success')}>
            {yearEndGap < 0
              ? `At today's set-aside habit, the year ends ${money(-yearEndGap, { whole: true })} short.`
              : `At today's set-aside habit, the year ends covered with ${money(yearEndGap, { whole: true })} to spare.`}
          </p>
          <table className="sr-only">
            <caption>Tax owed and money covering it, by month</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Tax owed</th>
                <th scope="col">Paid and in reserve</th>
              </tr>
            </thead>
            <tbody>
              {series.map((p) => (
                <tr key={p.month}>
                  <th scope="row">{p.label}</th>
                  <td>{money(p.taxActual ?? p.taxProjected ?? 0, { whole: true })}</td>
                  <td>{money(p.coveredActual ?? p.coveredProjected ?? 0, { whole: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </div>
    </section>
  )
}

function SeriesTooltip({ active, payload }: { active?: boolean; payload?: { payload: CumulativePoint }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const tax = p.taxActual ?? p.taxProjected ?? 0
  const covered = p.coveredActual ?? p.coveredProjected ?? 0
  const projected = p.taxActual === null
  return (
    <div className="rounded-[3px] border border-border bg-popover px-3 py-2 text-[12px] shadow-sm">
      <p className="font-medium">
        {p.label} {projected && <span className="font-normal text-muted-foreground">· projected</span>}
      </p>
      <p className="flex justify-between gap-4">
        <span>Tax owed</span>
        <span className="font-mono tabular-nums">{money(tax, { whole: true })}</span>
      </p>
      <p className="flex justify-between gap-4">
        <span>Paid + reserve</span>
        <span className="font-mono tabular-nums">{money(covered, { whole: true })}</span>
      </p>
      <p className={cn('mt-1 border-t border-border pt-1 font-mono tabular-nums', covered < tax ? 'text-destructive' : 'text-success')}>
        {covered < tax ? `short ${money(tax - covered, { whole: true })}` : `covered +${money(covered - tax, { whole: true })}`}
      </p>
    </div>
  )
}
