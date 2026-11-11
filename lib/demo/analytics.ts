import { getCategory } from './categories'
import { addDays, addMonths, addMonthsToKey, diffDays, eachDay, endOfMonth, minDate, monthKey, monthRange, startOfMonth } from './dates'
import type { Account, CategoryId, DemoState, ISODate, MonthKey, Period, Transaction } from './types'

export interface DateRange {
  start: ISODate
  end: ISODate
}

export const PERIODS: { id: Period; label: string; short: string }[] = [
  { id: 'this-month', label: 'This month', short: 'Month' },
  { id: 'last-3-months', label: 'Last 3 months', short: '3M' },
  { id: 'ytd', label: 'Year to date', short: 'YTD' },
  { id: 'last-12-months', label: 'Last 12 months', short: '12M' },
]

const round2 = (n: number) => Math.round(n * 100) / 100

/** Date range a period covers, ending today. "Last 3 months" includes the current month. */
export function periodRange(period: Period, today: ISODate): DateRange {
  switch (period) {
    case 'this-month':
      return { start: startOfMonth(today), end: today }
    case 'last-3-months':
      return { start: startOfMonth(addMonths(today, -2)), end: today }
    case 'ytd':
      return { start: `${today.slice(0, 4)}-01-01`, end: today }
    case 'last-12-months':
      return { start: startOfMonth(addMonths(today, -11)), end: today }
  }
}

/** The comparison range: same length, immediately before (same span last year for YTD). */
export function previousRange(period: Period, today: ISODate): DateRange {
  const current = periodRange(period, today)
  switch (period) {
    case 'this-month': {
      const start = startOfMonth(addMonths(today, -1))
      return { start, end: minDate(addDays(start, diffDays(today, current.start)), endOfMonth(start)) }
    }
    case 'last-3-months':
    case 'last-12-months': {
      const months = period === 'last-3-months' ? 3 : 12
      const start = addMonths(current.start, -months)
      return { start, end: minDate(addMonths(today, -months), endOfMonth(addMonths(current.start, -1))) }
    }
    case 'ytd':
      return { start: addMonths(current.start, -12), end: addMonths(today, -12) }
  }
}

export function inRange(date: ISODate, range: DateRange): boolean {
  return date >= range.start && date <= range.end
}

export function filterByRange<T extends { date: ISODate }>(items: readonly T[], range: DateRange): T[] {
  return items.filter((t) => inRange(t.date, range))
}

export function filterByPeriod<T extends { date: ISODate }>(items: readonly T[], period: Period, today: ISODate): T[] {
  return filterByRange(items, periodRange(period, today))
}

/**
 * How a transaction counts: income, expense (positive number = money spent) or neither.
 * Refunds in an expense category reduce spending. Uncategorised money in counts as income.
 */
export function flowOf(tx: Pick<Transaction, 'amount' | 'categoryId'>): { income: number; expense: number } {
  const category = getCategory(tx.categoryId)
  if (category.kind === 'transfer') return { income: 0, expense: 0 }
  if (category.kind === 'income') return { income: tx.amount, expense: 0 }
  if (tx.categoryId === 'uncategorised' && tx.amount > 0) return { income: tx.amount, expense: 0 }
  return { income: 0, expense: -tx.amount }
}

export interface Totals {
  income: number
  expenses: number
  net: number
}

export function totals(transactions: readonly Transaction[]): Totals {
  let income = 0
  let expenses = 0
  for (const t of transactions) {
    const f = flowOf(t)
    income += f.income
    expenses += f.expense
  }
  return { income: round2(income), expenses: round2(expenses), net: round2(income - expenses) }
}

export interface MonthPoint extends Totals {
  month: MonthKey
  /** Short label such as `Mar`. */
  label: string
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function monthLabelShort(month: MonthKey): string {
  return SHORT_MONTHS[Number(month.slice(5, 7)) - 1]
}

/** Income, expenses and net per calendar month, oldest first, ending with today's month. */
export function monthlySeries(transactions: readonly Transaction[], today: ISODate, months = 12): MonthPoint[] {
  const last = monthKey(today)
  const keys = monthRange(addMonthsToKey(last, -(months - 1)), last)
  const buckets = new Map<MonthKey, Transaction[]>(keys.map((k) => [k, []]))
  for (const t of transactions) buckets.get(monthKey(t.date))?.push(t)
  return keys.map((month) => ({ month, label: monthLabelShort(month), ...totals(buckets.get(month)!) }))
}

export interface CategoryTotal {
  categoryId: CategoryId
  total: number
  count: number
  /** Share of the kind's total, 0..1. */
  share: number
}

/** Totals per category for one kind, largest first. Expense totals are positive. */
export function byCategory(transactions: readonly Transaction[], kind: 'income' | 'expense' = 'expense'): CategoryTotal[] {
  const map = new Map<CategoryId, { total: number; count: number }>()
  for (const t of transactions) {
    const f = flowOf(t)
    const value = kind === 'income' ? f.income : f.expense
    if (value === 0) continue
    const entry = map.get(t.categoryId) ?? { total: 0, count: 0 }
    entry.total += value
    entry.count++
    map.set(t.categoryId, entry)
  }
  const sum = [...map.values()].reduce((s, e) => s + e.total, 0)
  return [...map.entries()]
    .map(([categoryId, e]) => ({ categoryId, total: round2(e.total), count: e.count, share: sum > 0 ? e.total / sum : 0 }))
    .filter((e) => e.total > 0)
    .sort((a, b) => b.total - a.total)
}

export interface Kpis extends Totals {
  /** (income − expenses) / income, or 0 without income. */
  savingsRate: number
  previous: Totals & { savingsRate: number }
  /** Relative change vs the previous range (0.12 = +12 %); null when the previous value is 0. */
  deltas: { income: number | null; expenses: number | null; net: number | null; savingsRate: number }
  range: DateRange
  previousRange: DateRange
}

export function savingsRateOf(t: Totals): number {
  return t.income > 0 ? t.net / t.income : 0
}

function relChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return (current - previous) / Math.abs(previous)
}

export function kpis(state: Pick<DemoState, 'transactions'>, period: Period, today: ISODate): Kpis {
  const range = periodRange(period, today)
  const prevRange = previousRange(period, today)
  const current = totals(filterByRange(state.transactions, range))
  const previous = totals(filterByRange(state.transactions, prevRange))
  const savingsRate = savingsRateOf(current)
  const prevRate = savingsRateOf(previous)
  return {
    ...current,
    savingsRate,
    previous: { ...previous, savingsRate: prevRate },
    deltas: {
      income: relChange(current.income, previous.income),
      expenses: relChange(current.expenses, previous.expenses),
      net: relChange(current.net, previous.net),
      savingsRate: savingsRate - prevRate,
    },
    range,
    previousRange: prevRange,
  }
}

export interface AccountBalance {
  account: Account
  balance: number
}

/** Balance per account = opening balance + every transaction up to `asOf` (inclusive). */
export function accountBalances(state: Pick<DemoState, 'accounts' | 'transactions'>, asOf?: ISODate): AccountBalance[] {
  return state.accounts.map((account) => {
    let balance = account.openingBalance
    for (const t of state.transactions) {
      if (t.accountId === account.id && (!asOf || t.date <= asOf)) balance += t.amount
    }
    return { account, balance: round2(balance) }
  })
}

export function totalBalance(state: Pick<DemoState, 'accounts' | 'transactions'>, asOf?: ISODate): number {
  return round2(accountBalances(state, asOf).reduce((s, b) => s + b.balance, 0))
}

/** Money you can use freely: everyday and savings accounts, not the tax reserve. */
export function liquidBalance(state: Pick<DemoState, 'accounts' | 'transactions'>, asOf?: ISODate): number {
  return round2(
    accountBalances(state, asOf)
      .filter((b) => b.account.purpose !== 'tax')
      .reduce((s, b) => s + b.balance, 0),
  )
}

/** Closing balance of all accounts at the end of each day in the range. */
export function balanceSeries(state: Pick<DemoState, 'accounts' | 'transactions'>, range: DateRange): { date: ISODate; balance: number }[] {
  const opening = state.accounts.reduce((s, a) => s + a.openingBalance, 0)
  const byDate = new Map<ISODate, number>()
  let before = opening
  for (const t of state.transactions) {
    if (t.date < range.start) before += t.amount
    else if (t.date <= range.end) byDate.set(t.date, (byDate.get(t.date) ?? 0) + t.amount)
  }
  let running = before
  return eachDay(range.start, range.end).map((date) => {
    running += byDate.get(date) ?? 0
    return { date, balance: round2(running) }
  })
}

/** Spending per day in a range (every day present, 0 when nothing was spent). */
export function dailySpend(transactions: readonly Transaction[], range: DateRange): { date: ISODate; amount: number }[] {
  const map = new Map<ISODate, number>()
  for (const t of transactions) {
    if (!inRange(t.date, range)) continue
    const { expense } = flowOf(t)
    if (expense !== 0) map.set(t.date, (map.get(t.date) ?? 0) + expense)
  }
  return eachDay(range.start, range.end).map((date) => ({ date, amount: round2(map.get(date) ?? 0) }))
}

/** Average monthly totals over the last `months` complete months before today's month. */
export function averageMonth(transactions: readonly Transaction[], today: ISODate, months = 3): Totals {
  const series = monthlySeries(transactions, today, months + 1).slice(0, months)
  const n = series.length || 1
  const income = series.reduce((s, m) => s + m.income, 0) / n
  const expenses = series.reduce((s, m) => s + m.expenses, 0) / n
  return { income: round2(income), expenses: round2(expenses), net: round2(income - expenses) }
}

/** Spending per category for one calendar month. */
export function categorySpendForMonth(transactions: readonly Transaction[], month: MonthKey): Map<CategoryId, number> {
  const map = new Map<CategoryId, number>()
  for (const t of transactions) {
    if (monthKey(t.date) !== month) continue
    const { expense } = flowOf(t)
    if (expense !== 0) map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + expense)
  }
  return map
}

export interface BudgetProgress {
  categoryId: CategoryId
  limit: number
  spent: number
  remaining: number
  /** spent / limit */
  ratio: number
  /** Share of the month elapsed (1 for past months). */
  monthElapsed: number
  /** `over` = above the limit; `warning` = spending ahead of the month's pace (≥ 90 % or ahead of time). */
  status: 'ok' | 'warning' | 'over'
}

/** Spending against each budget for a calendar month (default: today's month). */
export function budgetProgress(state: Pick<DemoState, 'budgets' | 'transactions'>, today: ISODate, month: MonthKey = monthKey(today)): BudgetProgress[] {
  const spend = categorySpendForMonth(state.transactions, month)
  const isCurrent = month === monthKey(today)
  const days = Number(endOfMonth(`${month}-01`).slice(8, 10))
  const monthElapsed = isCurrent ? Number(today.slice(8, 10)) / days : 1
  return state.budgets.map((b) => {
    const spent = round2(spend.get(b.categoryId) ?? 0)
    const ratio = b.monthlyLimit > 0 ? spent / b.monthlyLimit : 0
    const status = ratio > 1 ? 'over' : ratio >= 0.9 || (isCurrent && ratio > monthElapsed + 0.15) ? 'warning' : 'ok'
    return { categoryId: b.categoryId, limit: b.monthlyLimit, spent, remaining: round2(b.monthlyLimit - spent), ratio, monthElapsed, status }
  })
}
