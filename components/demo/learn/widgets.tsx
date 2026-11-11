'use client'

import { useMemo, useState, type ReactNode } from 'react'

import { SegmentBar } from '@/components/demo/charts'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { categorySpendForMonth } from '@/lib/demo/analytics'
import { getCategory } from '@/lib/demo/categories'
import { addMonthsToKey, monthKey } from '@/lib/demo/dates'
import { money, pct } from '@/lib/demo/format'
import { useAccountBalances, useClientStats, useDemoState, useMonthlySeries, useSubscriptions, useTaxEstimate, useToday } from '@/lib/demo/hooks'
import { marginalRate } from '@/lib/demo/tax'
import { cn } from '@/lib/utils'

function Frame({ title, children, result }: { title: string; children: ReactNode; result: ReactNode }) {
  return (
    <div className="space-y-4 rounded-md border border-border bg-card p-4 sm:p-5">
      <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">Try it · {title}</p>
      {children}
      <div aria-live="polite" className="border-t border-dashed border-border pt-3 text-sm text-pretty">
        {result}
      </div>
    </div>
  )
}

function SliderRow({ id, label, value, children }: { id: string; label: string; value: string; children: ReactNode }) {
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

const Mono = ({ children, className }: { children: ReactNode; className?: string }) => <span className={cn('font-mono tabular-nums', className)}>{children}</span>

function useCompleteMonths(n: number) {
  return useMonthlySeries(n + 1).slice(0, n)
}

function PayYourselfFirst() {
  const months = useCompleteMonths(3)
  const income = months.reduce((s, m) => s + m.income, 0) / 3
  const [rate, setRate] = useState(10)
  const monthly = (income * rate) / 100
  return (
    <Frame
      title="pick a share to save on payday"
      result={
        income > 0 ? (
          <>
            Saving {rate}% on payday builds <Mono className="text-success">{money(monthly * 12, { whole: true })}</Mono> in a year.
          </>
        ) : (
          'There is no income in the last three months to work from yet.'
        )
      }
    >
      <SliderRow id="w-pyf" label="Save on payday" value={`${rate}%`}>
        <Slider id="w-pyf" min={1} max={30} step={1} value={[rate]} onValueChange={([v]) => setRate(v)} aria-label="Share of income to save" />
      </SliderRow>
      <SegmentBar
        label="Your average month"
        format={(n) => money(n, { whole: true })}
        segments={[
          { key: 'save', label: 'Saved first', value: monthly, color: 'var(--success)' },
          { key: 'rest', label: 'Left to spend', value: Math.max(0, income - monthly), color: 'var(--muted-foreground)' },
        ]}
      />
    </Frame>
  )
}

function TaxSetAside() {
  const tax = useTaxEstimate()
  const [rate, setRate] = useState(Math.round(tax.currentSetAsideRate * 100) || 10)
  const reserve = (tax.projectedTaxableIncome * rate) / 100
  const gap = reserve - tax.projectedAnnualTax
  return (
    <Frame
      title="set-aside rate vs the year’s tax"
      result={
        tax.projectedTaxableIncome > 0 ? (
          <>
            At {rate}% you would end the year{' '}
            {gap >= 0 ? <Mono className="text-success">{money(gap, { whole: true })} ahead</Mono> : <Mono className="text-destructive">{money(-gap, { whole: true })} short</Mono>} of the tax bill. The rules
            suggest {pct(tax.suggestedSetAsideRate)}.
          </>
        ) : (
          'No taxable income this year, so nothing needs setting aside.'
        )
      }
    >
      <SliderRow id="w-tax" label="Set aside from each payment" value={`${rate}%`}>
        <Slider id="w-tax" min={0} max={40} step={1} value={[rate]} onValueChange={([v]) => setRate(v)} aria-label="Set-aside rate" />
      </SliderRow>
      <p className="text-xs text-muted-foreground">Illustrative, not tax advice.</p>
    </Frame>
  )
}

function EmergencyBuffer() {
  const months = useCompleteMonths(3)
  const costs = months.reduce((s, m) => s + m.expenses, 0) / 3
  const { liquid } = useAccountBalances()
  const [target, setTarget] = useState(3)
  const need = costs * target
  const covered = need > 0 ? liquid / need : 1
  return (
    <Frame
      title="size your buffer"
      result={
        <>
          {target} {target === 1 ? 'month' : 'months'} of your usual spending is <Mono>{money(need, { whole: true })}</Mono>.{' '}
          {covered >= 1 ? (
            <span className="text-success">You already have that.</span>
          ) : (
            <>
              You are <Mono className="text-destructive">{money(need - liquid, { whole: true })}</Mono> away.
            </>
          )}
        </>
      }
    >
      <SliderRow id="w-buf" label="Target" value={`${target} ${target === 1 ? 'month' : 'months'}`}>
        <Slider id="w-buf" min={1} max={6} step={1} value={[target]} onValueChange={([v]) => setTarget(v)} aria-label="Buffer target in months" />
      </SliderRow>
    </Frame>
  )
}

function FiftyThirtyTwenty() {
  const state = useDemoState()
  const today = useToday()
  const [span, setSpan] = useState('3')
  const n = Number(span)
  const split = useMemo(() => {
    let needs = 0
    let wants = 0
    let income = 0
    for (let i = 1; i <= n; i++) {
      const m = addMonthsToKey(monthKey(today), -i)
      for (const [id, amount] of categorySpendForMonth(state.transactions, m)) {
        if (id === 'tax-payment') continue
        if (getCategory(id).essential) needs += amount
        else wants += amount
      }
      income += state.transactions.filter((t) => monthKey(t.date) === m && t.amount > 0 && getCategory(t.categoryId).kind === 'income').reduce((s, t) => s + t.amount, 0)
    }
    return { needs, wants, left: Math.max(0, income - needs - wants), income }
  }, [state.transactions, today, n])
  const share = (v: number) => (split.income > 0 ? v / split.income : 0)
  return (
    <Frame
      title="your split against 50/30/20"
      result={
        split.income > 0 ? (
          <>
            Needs <Mono>{pct(share(split.needs))}</Mono>, wants <Mono>{pct(share(split.wants))}</Mono>, left over <Mono>{pct(share(split.left))}</Mono>.{' '}
            {share(split.needs) > 0.6 ? 'Needs are above 60%: a big fixed cost is the lever, not small treats.' : share(split.left) < 0.2 ? 'Less than 20% is left: look at the biggest want first.' : 'Close to the guide. Nice.'}
          </>
        ) : (
          'No income in this window to compare against.'
        )
      }
    >
      <ToggleGroup type="single" variant="outline" size="sm" value={span} onValueChange={(v) => v && setSpan(v)} aria-label="Months to include">
        <ToggleGroupItem value="3" className="px-3 font-mono text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
          3 months
        </ToggleGroupItem>
        <ToggleGroupItem value="12" className="px-3 font-mono text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
          12 months
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">You</p>
        <SegmentBar
          label="Your split"
          heightClassName="h-4"
          segments={[
            { key: 'needs', label: 'Needs', value: split.needs, color: 'var(--cat-1)' },
            { key: 'wants', label: 'Wants', value: split.wants, color: 'var(--cat-7)' },
            { key: 'left', label: 'Left over', value: split.left, color: 'var(--success)' },
          ]}
        />
        <p className="font-mono text-[11px] text-muted-foreground">Guide</p>
        <SegmentBar
          label="The 50/30/20 guide"
          heightClassName="h-4"
          segments={[
            { key: 'needs', label: 'Needs', value: 50, color: 'var(--cat-1)' },
            { key: 'wants', label: 'Wants', value: 30, color: 'var(--cat-7)' },
            { key: 'left', label: 'Savings', value: 20, color: 'var(--success)' },
          ]}
        />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {[
            ['Needs', 'var(--cat-1)'],
            ['Wants', 'var(--cat-7)'],
            ['Savings / left over', 'var(--success)'],
          ].map(([l, c]) => (
            <li key={l} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2.5 rounded-[2px]" style={{ backgroundColor: c }} />
              {l}
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  )
}

function NetBars({ values, labels, baseline, avg }: { values: number[]; labels: string[]; baseline?: number; avg?: (number | null)[] }) {
  const max = Math.max(...values.map(Math.abs), baseline ?? 0, 1)
  const hasNeg = values.some((v) => v < 0)
  const h = 96
  const zero = hasNeg ? h / 2 : h
  const scale = (hasNeg ? h / 2 : h) / max
  return (
    <div aria-hidden="true" className="relative" style={{ height: h + 18 }}>
      <div className="absolute inset-x-0 border-t border-border-strong" style={{ top: zero }} />
      {baseline !== undefined && <div className="absolute inset-x-0 border-t-2 border-destructive" style={{ top: zero - baseline * scale }} />}
      <div className="absolute inset-x-0 top-0 flex items-stretch gap-1" style={{ height: h }}>
        {values.map((v, i) => (
          <div key={i} className="relative flex-1">
            <span
              className={cn('absolute inset-x-[15%] rounded-[2px]', v >= 0 ? (baseline !== undefined && v < baseline ? 'bg-destructive/70' : 'bg-success') : 'bg-foreground')}
              style={v >= 0 ? { bottom: h - zero, height: Math.max(1, v * scale) } : { top: zero, height: Math.max(1, -v * scale) }}
            />
            {avg?.[i] != null && <span className="absolute inset-x-0 h-0.5 bg-foreground" style={{ top: zero - (avg[i] as number) * scale }} />}
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex gap-1">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center font-mono text-[9px] text-muted-foreground">
            {l.slice(0, 1)}
          </span>
        ))}
      </div>
    </div>
  )
}

function CashFlowReading() {
  const months = useCompleteMonths(12)
  const [smooth, setSmooth] = useState(false)
  const nets = months.map((m) => m.net)
  const avg = nets.map((_, i) => (i < 2 ? null : (nets[i] + nets[i - 1] + nets[i - 2]) / 3))
  const negative = nets.filter((n) => n < 0).length
  return (
    <Frame
      title="your last 12 months of net"
      result={
        <>
          {negative} of 12 months went below zero (dark bars). {smooth ? 'The line is the three-month average: it shows the trend without the noise of single months.' : 'Turn on the three-month average to see the trend.'}
        </>
      }
    >
      <NetBars values={nets} labels={months.map((m) => m.label)} avg={smooth ? avg : undefined} />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={smooth} onCheckedChange={(v) => setSmooth(v === true)} />
        Show the three-month average
      </label>
    </Frame>
  )
}

function SubscriptionAudit() {
  const subs = useSubscriptions().filter((s) => s.active)
  const [keep, setKeep] = useState<string[]>([])
  const drop = subs.filter((s) => !keep.includes(s.merchant))
  const saving = drop.reduce((s, x) => s + x.yearlyCost, 0)
  if (!subs.length) return null
  return (
    <Frame
      title="would you sign up again today?"
      result={
        <>
          Tick the ones you would sign up for again at today&apos;s price. The rest add up to <Mono className="text-success">{money(saving, { whole: true })}</Mono> a year.
        </>
      }
    >
      <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {subs.map((s) => {
          const id = `w-sub-${s.merchant.replace(/\W+/g, '-')}`
          return (
            <li key={s.merchant} className="flex items-center gap-2 text-sm">
              <Checkbox id={id} checked={keep.includes(s.merchant)} onCheckedChange={(v) => setKeep(v === true ? [...keep, s.merchant] : keep.filter((m) => m !== s.merchant))} />
              <label htmlFor={id} className="min-w-0 flex-1 truncate">
                {s.merchant}
              </label>
              <Mono className="text-xs text-muted-foreground">{money(s.yearlyCost, { whole: true })}/yr</Mono>
            </li>
          )
        })}
      </ul>
    </Frame>
  )
}

function InvoiceTerms() {
  const stats = useClientStats().filter((s) => s.paidCount > 0)
  const slowest = stats.reduce<(typeof stats)[number] | null>((a, b) => (!a || (b.avgDaysLate ?? 0) > (a.avgDaysLate ?? 0) ? b : a), null)
  const late = Math.max(0, slowest?.avgDaysLate ?? 0)
  const [terms, setTerms] = useState('30')
  const days = Number(terms) + late
  return (
    <Frame
      title="how long until the money arrives"
      result={
        <>
          On net {terms}
          {slowest ? (
            <>
              , a client who pays like <span className="font-medium">{slowest.client.name}</span> gets you paid about <Mono>{days}</Mono> days after you send the invoice.
            </>
          ) : (
            <>, an on-time client pays {terms} days after the invoice date.</>
          )}{' '}
          Every week shaved off is a week less you have to cover from savings.
        </>
      }
    >
      <ToggleGroup type="single" variant="outline" size="sm" value={terms} onValueChange={(v) => v && setTerms(v)} aria-label="Payment terms">
        {['7', '14', '30'].map((t) => (
          <ToggleGroupItem key={t} value={t} className="px-3 font-mono text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
            net {t}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div aria-hidden="true" className="relative h-6">
        <div className="absolute inset-x-0 top-3 h-px bg-border-strong" />
        <span className="absolute top-1.5 h-3 w-px bg-foreground" style={{ left: 0 }} />
        <span className="absolute top-1.5 h-3 w-0.5 bg-foreground" style={{ left: `${(Number(terms) / 75) * 100}%` }} />
        <span className="absolute top-2 h-2 rounded-[2px] bg-destructive/70" style={{ left: `${(Number(terms) / 75) * 100}%`, width: `${(late / 75) * 100}%` }} />
      </div>
      <p className="flex justify-between font-mono text-[11px] text-muted-foreground">
        <span>invoice sent</span>
        <span>due · then late days in red</span>
      </p>
    </Frame>
  )
}

function SeparateMoney() {
  const state = useDemoState()
  const today = useToday()
  const month = addMonthsToKey(monthKey(today), -1)
  const everyday = new Set(state.accounts.filter((a) => a.purpose === 'everyday').map((a) => a.id))
  const tx = state.transactions.filter((t) => monthKey(t.date) === month && everyday.has(t.accountId) && t.amount < 0 && t.categoryId !== 'transfer' && t.categoryId !== 'tax-payment')
  const business = tx.filter((t) => getCategory(t.categoryId).group === 'business').reduce((s, t) => s - t.amount, 0)
  const personal = tx.filter((t) => getCategory(t.categoryId).group === 'personal').reduce((s, t) => s - t.amount, 0)
  return (
    <Frame
      title="last month in your everyday account"
      result={
        business > 0 && personal > 0 ? (
          <>
            Business costs and personal spending shared one account last month. Split them, and the business half becomes your tax list.
          </>
        ) : (
          'Only one kind of spending went through this account: already separated.'
        )
      }
    >
      <SegmentBar
        label="Spending by kind"
        heightClassName="h-4"
        format={(n) => money(n, { whole: true })}
        segments={[
          { key: 'b', label: 'Business', value: business, color: 'var(--cat-1)' },
          { key: 'p', label: 'Personal', value: personal, color: 'var(--cat-7)' },
        ]}
      />
      <ul className="flex gap-4 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-cat-1" />
          Business
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-cat-7" />
          Personal
        </li>
      </ul>
    </Frame>
  )
}

function Deductible() {
  const state = useDemoState()
  const tax = useTaxEstimate()
  const [cost, setCost] = useState(500)
  const rate = marginalRate(tax.projectedBase, state.taxSettings)
  const saved = cost * rate
  return (
    <Frame
      title="what a deduction is worth"
      result={
        <>
          At your <Mono>{pct(rate)}</Mono> rate, a <Mono>{money(cost, { whole: true })}</Mono> deductible purchase saves <Mono className="text-success">{money(saved, { whole: true })}</Mono> of tax. It still
          costs you <Mono>{money(cost - saved, { whole: true })}</Mono>.
        </>
      }
    >
      <SliderRow id="w-ded" label="Business purchase" value={money(cost, { whole: true })}>
        <Slider id="w-ded" min={0} max={3000} step={50} value={[cost]} onValueChange={([v]) => setCost(v)} aria-label="Purchase amount" />
      </SliderRow>
      <SegmentBar
        label="Who pays for it"
        heightClassName="h-4"
        format={(n) => money(n, { whole: true })}
        segments={[
          { key: 'you', label: 'You pay', value: cost - saved, color: 'var(--foreground)' },
          { key: 'tax', label: 'Tax saved', value: saved, color: 'var(--success)' },
        ]}
      />
    </Frame>
  )
}

function IrregularIncome() {
  const months = useCompleteMonths(12)
  const incomes = months.map((m) => m.income)
  const min = Math.min(...incomes, 0)
  const max = Math.max(...incomes, 1)
  const sorted = [...incomes].sort((a, b) => a - b)
  const lean = sorted[Math.floor(sorted.length * 0.25)] ?? 0
  const [base, setBase] = useState(Math.round(lean / 50) * 50)
  const short = incomes.filter((v) => v < base).length
  return (
    <Frame
      title="pick a baseline for fixed costs"
      result={
        <>
          With fixed costs of <Mono>{money(base, { whole: true })}</Mono> a month, income fell short in {short} of the last 12 months (red bars).
        </>
      }
    >
      <NetBars values={incomes} labels={months.map((m) => m.label)} baseline={base} />
      <SliderRow id="w-irr" label="Baseline" value={money(base, { whole: true })}>
        <Slider id="w-irr" min={Math.max(0, Math.floor(min / 50) * 50)} max={Math.ceil(max / 50) * 50} step={50} value={[base]} onValueChange={([v]) => setBase(v)} aria-label="Baseline monthly income" />
      </SliderRow>
    </Frame>
  )
}

const WIDGETS: Record<string, () => ReactNode> = {
  'pay-yourself-first': PayYourselfFirst,
  'tax-set-aside': TaxSetAside,
  'emergency-buffer': EmergencyBuffer,
  'budget-50-30-20': FiftyThirtyTwenty,
  'cash-flow-chart': CashFlowReading,
  'subscription-audit': SubscriptionAudit,
  'invoice-terms': InvoiceTerms,
  'separate-money': SeparateMoney,
  deductible: Deductible,
  'irregular-income': IrregularIncome,
}

/** The small interactive piece for a lesson, worked out from the persona's own data. */
export function LessonWidget({ id }: { id: string }) {
  const Widget = WIDGETS[id]
  return Widget ? <Widget /> : null
}
