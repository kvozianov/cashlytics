'use client'

import { ChevronLeft, ChevronRight, PencilLine, Plus, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { CategoryBadge } from '@/components/demo/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { averageMonth, type BudgetProgress } from '@/lib/demo/analytics'
import { getCategory } from '@/lib/demo/categories'
import { addMonthsToKey, monthKey } from '@/lib/demo/dates'
import { formatMonth, money, pct } from '@/lib/demo/format'
import { useBudgetProgress } from '@/lib/demo/hooks'
import { useDemo } from '@/lib/demo/store'
import type { CategoryId, MonthKey } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { budgetSuggestions, categoryAverages, suggestedLimit } from './model'

/** Monthly budgets as ledger lines with a pace marker and a projected month-end. */
export function Budgets({ focus }: { focus: CategoryId | null }) {
  const { state, today, actions } = useDemo()
  const current = monthKey(today)
  const [month, setMonth] = useState<MonthKey>(current)
  const progress = useBudgetProgress(month)
  const averages = useMemo(() => categoryAverages(state, today), [state, today])
  const suggestions = useMemo(() => budgetSuggestions(state, today), [state, today])
  const income = useMemo(() => averageMonth(state.transactions, today, 3).income, [state.transactions, today])
  const isCurrent = month === current
  const oldest = addMonthsToKey(current, -11)

  const [detailed, setDetailed] = useState(false)
  const [all, setAll] = useState(false)
  const focusSuggestion = focus && !state.budgets.some((b) => b.categoryId === focus) ? focus : null
  const showDetails = detailed || !!focusSuggestion
  const rows = useMemo(
    () =>
      [...progress]
        .map((p) => ({ p, ...pace(p, isCurrent, averages.get(p.categoryId) ?? 0) }))
        .sort((a, b) => rank(a) - rank(b) || b.p.ratio - a.p.ratio),
    [progress, isCurrent, averages],
  )
  const shown = all || rows.length <= LIMIT ? rows : rows.slice(0, LIMIT)
  const totalLimit = progress.reduce((s, p) => s + p.limit, 0)
  const totalSpent = progress.reduce((s, p) => s + p.spent, 0)
  const over = rows.filter((r) => r.p.status === 'over').length
  const risky = rows.filter((r) => r.atRisk).length
  const sentence =
    rows.length === 0
      ? 'No budgets yet.'
      : over + risky === 0
        ? `All ${rows.length} budgets are on track${isCurrent ? ' this month' : ''}.`
        : [over && `${over} over`, risky && `${risky} at risk`].filter(Boolean).join(', ') + ` out of ${rows.length} budgets${isCurrent ? ' this month' : ''}.`

  return (
    <section id="budgets" aria-labelledby="budgets-title" className="@container scroll-mt-40 space-y-5 sm:scroll-mt-20 data-[flash]:outline-2 data-[flash]:outline-offset-4 data-[flash]:outline-lime">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="budgets-title" className="font-display text-xl font-semibold tracking-tight">
            Budgets
          </h2>
          <p className="text-[15px] text-muted-foreground">{sentence}</p>
        </div>
        {showDetails && (
          <div className="flex items-center gap-1" role="group" aria-label="Month">
            <Button variant="ghost" size="icon-sm" aria-label="Previous month" disabled={month <= oldest} onClick={() => setMonth((m) => addMonthsToKey(m, -1))}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <p className="w-24 text-center font-mono text-[13px] tabular-nums" aria-live="polite">
              {formatMonth(month)}
            </p>
            <Button variant="ghost" size="icon-sm" aria-label="Next month" disabled={isCurrent} onClick={() => setMonth((m) => addMonthsToKey(m, 1))}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-card">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground sm:px-6">Add one from the suggestions under “Show details”.</p>
        ) : (
          <ul className="divide-y divide-dashed divide-border px-4 sm:px-6">
            {shown.map(({ p }) => (
              <BudgetLine
                key={p.categoryId}
                progress={p}
                isCurrent={isCurrent}
                average={averages.get(p.categoryId) ?? 0}
                detailed={showDetails}
                focused={focus === p.categoryId}
                onSave={(limit) => actions.setBudget(p.categoryId, limit)}
                onRemove={() => actions.setBudget(p.categoryId, null)}
              />
            ))}
          </ul>
        )}
        {rows.length > LIMIT && (
          <div className="border-t border-border px-4 py-3 sm:px-6">
            <button type="button" onClick={() => setAll((a) => !a)} className="text-[13px] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
              {all ? 'Show fewer' : `Show all ${rows.length}`}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        aria-expanded={showDetails}
        onClick={() => setDetailed((d) => !d)}
        className="text-[13px] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
      >
        {showDetails ? 'Hide details' : 'Show details: pace, other months, suggestions'}
      </button>

      {showDetails && (
        <div className="space-y-6 rounded-md border border-border bg-card">
          <p className="px-4 pt-4 text-[13px] text-muted-foreground sm:px-6">
            The ▾ on each bar marks where spending should be by today; the hatched part is where the month ends at your usual pace.
          </p>
          <div className="grid gap-x-6 gap-y-1 px-4 text-[13px] sm:px-6 @2xl:grid-cols-2">
            <p className="flex items-baseline gap-2">
              <span>Spent against budgets</span>
              <span aria-hidden="true" className="ldr-leader" />
              <span className="font-mono tabular-nums">
                {money(totalSpent, { whole: true })} of {money(totalLimit, { whole: true })}
              </span>
            </p>
            <p className="flex items-baseline gap-2">
              <span>Budgeted vs average income</span>
              <span aria-hidden="true" className="ldr-leader" />
              <span className="font-mono tabular-nums">{income > 0 ? `${pct(totalLimit / income)} of ${money(income, { whole: true })}` : '—'}</span>
            </p>
          </div>
          {(suggestions.length > 0 || focusSuggestion) && (
            <Suggestions suggestions={suggestions} focus={focusSuggestion} averages={averages} onAdd={(id, limit) => actions.setBudget(id, limit)} />
          )}
        </div>
      )}
    </section>
  )
}

const LIMIT = 6

/** Month-end at the usual (3-month) pace; straight-line pace only without history. */
function pace(p: BudgetProgress, isCurrent: boolean, average: number) {
  const projected =
    !isCurrent || p.monthElapsed >= 1 ? p.spent : average > 0 ? p.spent + average * (1 - p.monthElapsed) : p.monthElapsed > 0 ? p.spent / p.monthElapsed : p.spent
  const atRisk = p.status !== 'over' && (p.status === 'warning' || projected > p.limit * 1.02)
  return { projected, atRisk }
}

const rank = (r: { p: BudgetProgress; atRisk: boolean }) => (r.p.status === 'over' ? 0 : r.atRisk ? 1 : 2)

function BudgetLine({
  progress: p,
  isCurrent,
  average,
  detailed,
  focused,
  onSave,
  onRemove,
}: {
  progress: BudgetProgress
  isCurrent: boolean
  average: number
  detailed: boolean
  focused: boolean
  onSave: (limit: number) => void
  onRemove: () => void
}) {
  const uid = useId()
  const ref = useRef<HTMLLIElement>(null)
  const [editing, setEditing] = useState(focused)
  const [text, setText] = useState(String(p.limit))
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!focused || !ref.current) return
    const t = window.setTimeout(() => {
      ref.current?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      ref.current?.querySelector<HTMLInputElement>('input')?.focus()
    }, 80)
    return () => window.clearTimeout(t)
  }, [focused])

  const value = Number(text.replace(/[,$\s]/g, ''))
  const error = !Number.isFinite(value) || value <= 0 ? 'Enter a monthly limit above $0.' : value > 100_000 ? 'That is more than this demo allows.' : ''
  const { projected, atRisk } = pace(p, isCurrent, average)
  const scale = Math.max(p.limit, detailed ? projected : 0, p.spent) * 1.08 || 1
  const at = (v: number) => `${Math.min(100, (v / scale) * 100)}%`
  const label = getCategory(p.categoryId).label

  const status =
    p.status === 'over'
      ? { text: `Over by ${money(p.spent - p.limit, { whole: true })}`, tone: 'text-destructive' }
      : atRisk
        ? { text: isCurrent && projected > p.limit ? `At risk · heading for ${money(projected, { whole: true })}` : 'Nearly used up', tone: 'text-warning' }
        : { text: isCurrent ? `On pace · ${money(p.remaining, { whole: true })} left` : `${money(p.remaining, { whole: true })} under`, tone: 'text-muted-foreground' }
  const simpleStatus =
    p.status === 'over'
      ? { text: `Over by ${money(p.spent - p.limit, { whole: true })}`, tone: 'text-destructive' }
      : atRisk
        ? { text: `At risk · ${money(Math.max(0, p.remaining), { whole: true })} left`, tone: 'text-warning' }
        : { text: `${money(p.remaining, { whole: true })} left`, tone: 'text-foreground' }

  const save = () => {
    setTouched(true)
    if (error) return
    if (value !== p.limit) onSave(value)
    setEditing(false)
    setTouched(false)
  }

  return (
    <li ref={ref} id={`budget-${p.categoryId}`} className={cn('scroll-mt-28 py-3.5', focused && 'rounded-sm bg-accent/25 -mx-2 px-2')}>
      <div className={cn('flex items-center gap-x-3 gap-y-2', editing || detailed ? 'flex-wrap' : 'flex-nowrap')}>
        <CategoryBadge categoryId={p.categoryId} size="sm" className="min-w-0" />
        <span aria-hidden="true" className="ldr-leader hidden sm:block" />
        {editing ? (
          <form
            className="ml-auto flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
            noValidate
          >
            <label htmlFor={`${uid}-limit`} className="sr-only">
              Monthly limit for {label}, dollars
            </label>
            <span className="font-mono text-sm text-muted-foreground">$</span>
            <Input
              id={`${uid}-limit`}
              inputMode="decimal"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setEditing(false)
                  setText(String(p.limit))
                }
              }}
              aria-invalid={touched && !!error}
              aria-describedby={`${uid}-err`}
              className="h-8 w-24 text-right font-mono"
            />
            {average > 0 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setText(String(suggestedLimit(average)))}>
                3-mo avg {money(average, { whole: true })}
              </Button>
            )}
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove the ${label} budget`} onClick={onRemove}>
              <X aria-hidden="true" />
            </Button>
          </form>
        ) : (
          <>
            {detailed ? (
              <span className="ml-auto font-mono text-[13.5px] tabular-nums sm:ml-0">
                <span className={cn(p.status === 'over' && 'text-destructive')}>{money(p.spent, { whole: true })}</span>
                <span className="text-muted-foreground"> of </span>
                {money(p.limit, { whole: true })}
              </span>
            ) : (
              <span className={cn('ml-auto shrink-0 text-[14px] whitespace-nowrap sm:ml-0', simpleStatus.tone)}>
                {(p.status === 'over' || atRisk) && <span className="sr-only">{p.status === 'over' ? 'Over budget: ' : 'Warning: '}</span>}
                <span className="tabular-nums">{simpleStatus.text}</span>
              </span>
            )}
            <Button size="icon-sm" variant="ghost" aria-label={`Edit the ${label} limit`} onClick={() => setEditing(true)}>
              <PencilLine aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
      {editing && touched && error && (
        <p id={`${uid}-err`} className="mt-1 text-right text-[12px] text-destructive">
          {error}
        </p>
      )}

      <div className={cn('mt-2.5 grid gap-1.5 sm:items-center sm:gap-4', detailed && 'sm:grid-cols-[minmax(0,1fr)_14rem]')}>
        <div className="relative h-2.5" aria-hidden="true">
          <div className="absolute inset-y-0 left-0 rounded-[2px] bg-muted" style={{ width: at(p.limit) }} />
          {detailed && projected > p.spent && (
            <div
              className={cn(
                'absolute inset-y-0 rounded-r-[2px] bg-[repeating-linear-gradient(135deg,currentColor_0_1.5px,transparent_1.5px_5px)] opacity-60',
                projected > p.limit ? 'text-destructive' : 'text-muted-foreground',
              )}
              style={{ left: at(p.spent), width: `calc(${at(projected)} - ${at(p.spent)})` }}
            />
          )}
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-[2px] transition-[width] duration-500 ease-out motion-reduce:transition-none',
              p.status === 'over' ? 'bg-destructive' : atRisk ? 'bg-warning' : 'bg-foreground',
            )}
            style={{ width: at(p.spent) }}
          />
          <div className="absolute -inset-y-1 w-0.5 bg-foreground" style={{ left: at(p.limit) }} title="Limit" />
          {detailed && isCurrent && p.monthElapsed < 1 && (
            <div className="absolute -top-1.5 h-0 w-0 -translate-x-1/2 border-x-4 border-t-[5px] border-x-transparent border-t-foreground" style={{ left: at(p.limit * p.monthElapsed) }} />
          )}
        </div>
        {detailed && (
          <p className={cn('text-[12.5px] sm:text-right', status.tone)}>
            {(p.status === 'over' || atRisk) && <span className="sr-only">{p.status === 'over' ? 'Over budget: ' : 'Warning: '}</span>}
            {status.text}
          </p>
        )}
      </div>
      <p className="sr-only">
        {label}: spent {money(p.spent, { whole: true })} of {money(p.limit, { whole: true })}
        {isCurrent ? `, expected by today ${money(p.limit * p.monthElapsed, { whole: true })}, projected for the month ${money(projected, { whole: true })}.` : '.'}
      </p>
    </li>
  )
}

function Suggestions({
  suggestions,
  focus,
  averages,
  onAdd,
}: {
  suggestions: { categoryId: CategoryId; average: number; limit: number }[]
  focus: CategoryId | null
  averages: Map<CategoryId, number>
  onAdd: (id: CategoryId, limit: number) => void
}) {
  const list = useMemo(() => {
    const top = suggestions.slice(0, 5)
    if (focus && !top.some((s) => s.categoryId === focus)) {
      const avg = averages.get(focus) ?? 0
      top.unshift({ categoryId: focus, average: avg, limit: suggestedLimit(avg) || 50 })
    }
    return top
  }, [suggestions, focus, averages])

  return (
    <div className="border-t border-border px-4 py-4 sm:px-6">
      <p className="mb-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Suggested from your last 3 months</p>
      <ul className="grid gap-2 @xl:grid-cols-2 @4xl:grid-cols-3">
        {list.map((s) => (
          <SuggestionItem key={s.categoryId} suggestion={s} focused={s.categoryId === focus} onAdd={onAdd} />
        ))}
      </ul>
    </div>
  )
}

function SuggestionItem({
  suggestion: s,
  focused,
  onAdd,
}: {
  suggestion: { categoryId: CategoryId; average: number; limit: number }
  focused: boolean
  onAdd: (id: CategoryId, limit: number) => void
}) {
  const uid = useId()
  const [text, setText] = useState(String(s.limit))
  const value = Number(text.replace(/[,$\s]/g, ''))
  const valid = Number.isFinite(value) && value > 0
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (!focused) return
    const t = window.setTimeout(() => {
      ref.current?.scrollIntoView({ block: 'center' })
      ref.current?.querySelector('input')?.focus()
    }, 80)
    return () => window.clearTimeout(t)
  }, [focused])

  return (
    <li ref={ref} id={`budget-${s.categoryId}`} className={cn('flex flex-wrap items-center gap-2 rounded-[3px] border border-dashed border-border p-2.5', focused && 'border-solid border-foreground bg-accent/25')}>
      <CategoryBadge categoryId={s.categoryId} size="sm" />
      <span className="text-[12px] text-muted-foreground">avg {money(s.average, { whole: true })}</span>
      <form
        className="ml-auto flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onAdd(s.categoryId, value)
        }}
        noValidate
      >
        <label htmlFor={`${uid}-v`} className="sr-only">
          Monthly limit for {getCategory(s.categoryId).label}, dollars
        </label>
        <Input id={`${uid}-v`} inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} aria-invalid={!valid} className="h-8 w-20 text-right font-mono" />
        <Button type="submit" size="sm" variant="outline" disabled={!valid} aria-label={`Add a ${getCategory(s.categoryId).label} budget of ${valid ? money(value, { whole: true }) : 'this amount'}`}>
          <Plus aria-hidden="true" />
          Add
        </Button>
      </form>
    </li>
  )
}
