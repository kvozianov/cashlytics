import { averageMonth, categorySpendForMonth } from '@/lib/demo/analytics'
import { getCategory } from '@/lib/demo/categories'
import { addMonths, addMonthsToKey, diffDays, monthKey } from '@/lib/demo/dates'
import type { CategoryId, DemoState, Goal, ISODate, MonthKey } from '@/lib/demo/types'

const round2 = (n: number) => Math.round(n * 100) / 100

const NOT_BUDGETABLE = new Set<CategoryId>(['tax-payment', 'transfer', 'uncategorised', 'business-loan', 'payroll'])

/** The last `n` complete months before `today`'s month, oldest first. */
export function completeMonths(today: ISODate, n = 3): MonthKey[] {
  const current = monthKey(today)
  return Array.from({ length: n }, (_, i) => addMonthsToKey(current, -(n - i)))
}

/** Average monthly spend per expense category over the last three complete months. */
export function categoryAverages(state: Pick<DemoState, 'transactions'>, today: ISODate): Map<CategoryId, number> {
  const months = completeMonths(today)
  const sum = new Map<CategoryId, number>()
  for (const m of months) {
    for (const [id, amount] of categorySpendForMonth(state.transactions, m)) {
      if (amount <= 0) continue
      sum.set(id, (sum.get(id) ?? 0) + amount)
    }
  }
  return new Map([...sum.entries()].map(([id, total]) => [id, round2(total / months.length)]))
}

/** A tidy limit just above the average. */
export function suggestedLimit(average: number): number {
  if (average <= 0) return 0
  const step = average < 200 ? 5 : average < 1000 ? 10 : 50
  return Math.ceil(average / step) * step
}

export interface BudgetSuggestion {
  categoryId: CategoryId
  average: number
  limit: number
}

/** Categories with regular spending and no budget yet, largest first. */
export function budgetSuggestions(state: Pick<DemoState, 'transactions' | 'budgets'>, today: ISODate): BudgetSuggestion[] {
  const budgeted = new Set(state.budgets.map((b) => b.categoryId))
  return [...categoryAverages(state, today).entries()]
    .filter(([id, avg]) => !budgeted.has(id) && !NOT_BUDGETABLE.has(id) && getCategory(id).kind === 'expense' && avg >= 15)
    .map(([categoryId, average]) => ({ categoryId, average, limit: suggestedLimit(average) }))
    .sort((a, b) => b.average - a.average)
}

export interface Split {
  income: number
  needs: number
  wants: number
  saved: number
}

/**
 * Needs / wants / left over, monthly average of the last three complete months.
 * Same method as the 50/30/20 lesson: essential categories are needs, the rest wants.
 */
export function needsWantsSplit(state: Pick<DemoState, 'transactions'>, today: ISODate): Split {
  const months = completeMonths(today)
  let needs = 0
  let wants = 0
  for (const m of months) {
    for (const [id, amount] of categorySpendForMonth(state.transactions, m)) {
      if (id === 'tax-payment') continue
      if (getCategory(id).essential) needs += amount
      else wants += amount
    }
  }
  const income = averageMonth(state.transactions, today, 3).income
  needs /= months.length
  wants /= months.length
  return { income: round2(income), needs: round2(needs), wants: round2(wants), saved: round2(income - needs - wants) }
}

/** Average monthly spending over the last three complete months. */
export function averageMonthlySpend(state: Pick<DemoState, 'transactions'>, today: ISODate): number {
  return averageMonth(state.transactions, today, 3).expenses
}

const BUFFER = /buffer|emergency|safety|reserve|runway|rainy/i

export function hasBufferGoal(goals: readonly Goal[]): boolean {
  return goals.some((g) => g.id === 'goal-buffer' || BUFFER.test(g.name))
}

export function isBufferGoal(goal: Goal): boolean {
  return goal.id === 'goal-buffer' || BUFFER.test(goal.name)
}

/** Whole months from today until `date` (at least 1). */
export function monthsUntil(today: ISODate, date: ISODate): number {
  return Math.max(1, Math.round(diffDays(date, today) / 30.44))
}

export interface GoalPlan {
  remaining: number
  /** Per month needed to hit the target date, if there is one. */
  needed: number | null
  /** Projected completion date at `monthly`, null if it never completes. */
  projectedDate: ISODate | null
  months: number | null
  /** Projected minus target, in months (positive = late). */
  slipMonths: number | null
}

export function goalPlan(goal: Goal, today: ISODate, monthly: number): GoalPlan {
  const remaining = Math.max(0, round2(goal.target - goal.saved))
  const needed = goal.targetDate ? round2(remaining / monthsUntil(today, goal.targetDate)) : null
  if (remaining <= 0) return { remaining, needed, projectedDate: today, months: 0, slipMonths: goal.targetDate ? 0 : null }
  if (monthly <= 0) return { remaining, needed, projectedDate: null, months: null, slipMonths: null }
  const months = Math.ceil(remaining / monthly)
  const projectedDate = addMonths(today, months)
  const slipMonths = goal.targetDate ? Math.round(diffDays(projectedDate, goal.targetDate) / 30.44) : null
  return { remaining, needed, projectedDate, months, slipMonths }
}

/** Average net money added to an account per month over the last 90 days (0 if it shrank). */
export function accountPace(state: Pick<DemoState, 'transactions'>, accountId: string, today: ISODate): number {
  let net = 0
  for (const t of state.transactions) {
    if (t.accountId !== accountId || t.date > today) continue
    if (diffDays(today, t.date) > 90) break
    net += t.amount
  }
  return Math.max(0, round2(net / 3))
}
