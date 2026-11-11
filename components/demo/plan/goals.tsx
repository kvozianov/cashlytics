'use client'

import { Check, PencilLine, PiggyBank, Plus } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import { ChangeList, type Change } from '@/components/demo/invoices/knock-on'
import { Slider } from '@/components/ui/slider'
import { ShowDetails } from '@/components/demo/tax/quiet'
import { Ring } from '@/components/demo/tax/ring'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { accountBalances } from '@/lib/demo/analytics'
import { formatDate, formatMonth, money, pct } from '@/lib/demo/format'
import { useDemo } from '@/lib/demo/store'
import type { Goal } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { GoalDialog, type GoalDialogMode } from './goal-dialog'
import { accountPace, averageMonthlySpend, goalPlan, hasBufferGoal } from './model'

export function Goals() {
  const { state, today, persona } = useDemo()
  const [dialog, setDialog] = useState<GoalDialogMode | null>(null)
  const avgSpend = useMemo(() => averageMonthlySpend(state, today), [state, today])
  const bufferMonths = persona.kind === 'business' ? 2 : 3
  const suggestBuffer = !hasBufferGoal(state.goals) && avgSpend > 0
  const savings = state.accounts.find((a) => a.purpose === 'savings')

  return (
    <section id="goals" aria-labelledby="goals-title" className="scroll-mt-40 sm:scroll-mt-20 space-y-5 data-[flash]:outline-2 data-[flash]:outline-offset-4 data-[flash]:outline-lime">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="goals-title" className="font-display text-xl font-semibold tracking-tight">
            Savings goals
          </h2>
          <p className="text-[15px] text-muted-foreground">When you will get there at your monthly amount.</p>
        </div>
        <Button variant="outline" onClick={() => setDialog({ kind: 'new' })}>
          <Plus aria-hidden="true" />
          New goal
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        {suggestBuffer && (
          <div className="flex flex-col justify-between gap-4 rounded-md border-2 border-dashed border-border p-4 sm:p-5">
            <div className="space-y-2">
              <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Suggested</p>
              <p className="font-medium">{persona.kind === 'business' ? 'Cash reserve' : 'Emergency buffer'}</p>
              <p className="text-[13px] text-pretty text-muted-foreground">
                You spend about {money(avgSpend, { whole: true })} a month. {bufferMonths} months of that, {money(Math.ceil((avgSpend * bufferMonths) / 100) * 100, { whole: true })}, would absorb a
                lost {persona.kind === 'business' ? 'month of sales' : 'job or a big repair'} without debt.
              </p>
            </div>
            <Button
              className="self-start"
              onClick={() =>
                setDialog({
                  kind: 'new',
                  preset: {
                    name: persona.kind === 'business' ? 'Cash reserve' : 'Emergency buffer',
                    target: Math.ceil((avgSpend * bufferMonths) / 100) * 100,
                    saved: 0,
                    accountId: savings?.id,
                  },
                })
              }
            >
              Add this goal
            </Button>
          </div>
        )}
        {state.goals.map((g) => (
          <GoalCard key={g.id} goal={g} onEdit={() => setDialog({ kind: 'edit', goal: g })} />
        ))}
        {state.goals.length === 0 && !suggestBuffer && (
          <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">No goals yet. Add one to see when you will reach it.</p>
        )}
      </div>

      <GoalDialog mode={dialog} onClose={() => setDialog(null)} />
    </section>
  )
}

function GoalCard({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
  const { state, today, actions } = useDemo()
  const [extra, setExtra] = useState(0)
  const [moved, setMoved] = useState<Change[] | null>(null)
  const pace = useMemo(() => (goal.accountId ? accountPace(state, goal.accountId, today) : 0), [goal.accountId, state, today])
  const derived = goal.monthlyContribution === undefined && pace >= 5
  const monthly = goal.monthlyContribution ?? (derived ? Math.round(pace) : 0)
  const plan = goalPlan(goal, today, monthly)
  const whatIf = goalPlan(goal, today, monthly + extra)
  const progress = goal.target > 0 ? goal.saved / goal.target : 0
  const done = plan.remaining <= 0
  const account = goal.accountId ? state.accounts.find((a) => a.id === goal.accountId) : undefined
  const late = plan.slipMonths !== null && plan.slipMonths > 0
  const sooner = plan.months !== null && whatIf.months !== null ? plan.months - whatIf.months : null
  const tone = done ? 'success' : late || (plan.needed && monthly === 0) ? 'warning' : 'ink'

  function contribute(amount: number) {
    const everyday = state.accounts.find((a) => a.purpose === 'everyday') ?? state.accounts[0]
    const bal = (s: typeof state, id: string) => accountBalances(s, today).find((b) => b.account.id === id)?.balance ?? 0
    const before = { saved: goal.saved, from: bal(state, everyday.id), to: account ? bal(state, account.id) : 0 }
    actions.contributeToGoal(goal.id, amount)
    setMoved([
      { label: goal.name, before: before.saved, after: before.saved + amount, goodWhen: 'up' },
      ...(account && account.id !== everyday.id
        ? [
            { label: everyday.name, before: before.from, after: before.from - amount, goodWhen: 'neutral' as const, href: '/demo/transactions' },
            { label: account.name, before: before.to, after: before.to + amount, goodWhen: 'up' as const },
          ]
        : []),
    ])
  }

  const planned = Math.ceil((plan.needed ?? 0) / 5) * 5
  const sentence = done
    ? 'Reached. Nice work.'
    : plan.projectedDate
      ? `At ${money(monthly, { whole: true })} a month you get there in ${formatMonth(plan.projectedDate.slice(0, 7), { long: true })}${late ? `, about ${plan.slipMonths} months late` : plan.slipMonths !== null ? ', on time' : ''}.`
      : 'No monthly amount yet, so there is no date.'

  return (
    <article className="flex flex-col gap-5 rounded-md border border-border bg-card p-5 sm:p-6" aria-labelledby={`goal-${goal.id}`}>
      <div className="flex items-start gap-5">
        <Ring value={progress} size={72} stroke={6} tone={tone} label={`${pct(Math.min(progress, 1))} saved`} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 id={`goal-${goal.id}`} className="text-[17px] font-medium text-balance">
              {goal.name}
            </h3>
            <Button size="icon-sm" variant="ghost" aria-label={`Edit ${goal.name}`} onClick={onEdit}>
              <PencilLine aria-hidden="true" />
            </Button>
          </div>
          <p className="font-mono text-xl tabular-nums">
            {money(goal.saved, { whole: true })} <span className="text-[14px] text-muted-foreground">of {money(goal.target, { whole: true })}</span>
          </p>
        </div>
      </div>

      <p className={cn('text-[15px] text-pretty', late && 'text-warning')}>{sentence}</p>

      {moved && (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[13px] font-medium">
            <Check aria-hidden="true" className="size-4 text-success" />
            Moved
          </p>
          <ChangeList changes={moved} />
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {!done && <ContributeButton goal={goal} suggested={monthly || plan.needed || 100} onContribute={contribute} />}
        {!done && monthly === 0 && planned > 0 && (
          <Button size="sm" variant="outline" onClick={() => actions.updateGoal(goal.id, { monthlyContribution: planned })}>
            Plan {money(planned, { whole: true })} a month
          </Button>
        )}
      </div>

      {!done && (
        <ShowDetails label="What if I add more?" openLabel="Hide">
          <div className="space-y-3">
            <dl className="space-y-1 text-[13px]">
              <div className="flex items-baseline gap-2">
                <dt className="text-muted-foreground">{account ? `Held in ${account.name}` : 'Not linked to an account'}</dt>
                <span aria-hidden="true" className="ldr-leader" />
                <dd>{goal.targetDate ? `target ${formatDate(goal.targetDate)}` : 'no target date'}</dd>
              </div>
              {plan.needed !== null && (
                <div className="flex items-baseline gap-2">
                  <dt className="text-muted-foreground">Needed per month for the target date</dt>
                  <span aria-hidden="true" className="ldr-leader" />
                  <dd className="font-mono tabular-nums">{money(plan.needed, { whole: true })}</dd>
                </div>
              )}
              {derived && <p className="text-[12px] text-muted-foreground">The monthly amount is your pace over the last 3 months.</p>}
            </dl>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <p>
                Add <span className="font-mono font-medium tabular-nums">{money(extra, { whole: true })}</span> a month
              </p>
              <p className="font-mono text-[12.5px] tabular-nums">{whatIf.projectedDate ? formatDate(whatIf.projectedDate) : '—'}</p>
            </div>
            <Slider
              aria-label={`Extra per month for ${goal.name}`}
              aria-valuetext={`${money(extra, { whole: true })} a month, reached ${whatIf.projectedDate ? formatDate(whatIf.projectedDate) : 'never at this rate'}`}
              min={0}
              max={Math.max(500, Math.ceil(goal.target / 2400) * 100)}
              step={25}
              value={[extra]}
              onValueChange={([v]) => setExtra(v)}
            />
            <p className="text-[12px] text-muted-foreground" aria-live="polite">
              {extra === 0
                ? 'Drag to see how much sooner.'
                : sooner !== null && sooner > 0
                  ? `${sooner} ${sooner === 1 ? 'month' : 'months'} sooner.`
                  : plan.months === null && whatIf.months !== null
                    ? `Reached in ${whatIf.months} months.`
                    : 'About the same month.'}
              {extra > 0 && (
                <button type="button" className="ml-2 underline underline-offset-4" onClick={() => actions.updateGoal(goal.id, { monthlyContribution: monthly + extra })}>
                  Make it {money(monthly + extra, { whole: true })} a month
                </button>
              )}
            </p>
          </div>
        </ShowDetails>
      )}
    </article>
  )
}

function ContributeButton({ goal, suggested, onContribute }: { goal: Goal; suggested: number; onContribute: (amount: number) => void }) {
  const uid = useId()
  const { state, today } = useDemo()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const everyday = state.accounts.find((a) => a.purpose === 'everyday') ?? state.accounts[0]
  const available = accountBalances(state, today).find((b) => b.account.id === everyday.id)?.balance ?? 0
  const remaining = Math.max(0, goal.target - goal.saved)
  const value = Number(text.replace(/[,$\s]/g, ''))
  const error = text.trim() === '' ? '' : !Number.isFinite(value) || value <= 0 ? 'Enter an amount above $0.' : goal.accountId && value > available ? `Only ${money(available, { whole: true })} in ${everyday.name}.` : ''
  const chips = [...new Set([Math.round(suggested / 5) * 5, 50, 100, 250].filter((v) => v > 0 && v <= Math.max(remaining, 1)))].slice(0, 3)

  const submit = (amount: number) => {
    onContribute(Math.round(amount * 100) / 100)
    setOpen(false)
    setText('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm">
          <PiggyBank aria-hidden="true" />
          Contribute
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (!error && Number.isFinite(value) && value > 0) submit(value)
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <label htmlFor={`${uid}-amt`} className="text-sm font-medium">
              Add to {goal.name}
            </label>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm text-muted-foreground">$</span>
              <input
                id={`${uid}-amt`}
                inputMode="decimal"
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={`${uid}-hint`}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-right font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive"
              />
            </div>
            <p id={`${uid}-hint`} className={cn('text-[12px]', error ? 'text-destructive' : 'text-muted-foreground')}>
              {error || (goal.accountId ? `Moves money from ${everyday.name} (${money(available, { whole: true })}).` : 'Records progress; this goal has no account.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <Button key={c} type="button" size="sm" variant="outline" className="font-mono" onClick={() => setText(String(c))}>
                {money(c, { whole: true })}
              </Button>
            ))}
          </div>
          <Button type="submit" className="w-full" disabled={!!error || !(value > 0)}>
            Add {Number.isFinite(value) && value > 0 ? money(value) : ''}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
