import { describe, expect, it } from 'vitest'

import {
  accountBalances,
  budgetProgress,
  byCategory,
  dailySpend,
  filterByPeriod,
  flowOf,
  kpis,
  liquidBalance,
  monthlySeries,
  periodRange,
  previousRange,
  totals,
} from '../analytics'
import { stateFor, TODAY } from './fixtures'

describe('periods', () => {
  it('builds ranges that end today', () => {
    expect(periodRange('this-month', TODAY)).toEqual({ start: '2026-11-01', end: TODAY })
    expect(periodRange('last-3-months', TODAY)).toEqual({ start: '2026-09-01', end: TODAY })
    expect(periodRange('ytd', TODAY)).toEqual({ start: '2026-01-01', end: TODAY })
    expect(periodRange('last-12-months', TODAY)).toEqual({ start: '2025-12-01', end: TODAY })
  })

  it('compares with a same-length range before', () => {
    expect(previousRange('this-month', TODAY)).toEqual({ start: '2026-10-01', end: '2026-10-11' })
    expect(previousRange('ytd', TODAY)).toEqual({ start: '2025-01-01', end: '2025-11-11' })
    expect(previousRange('last-3-months', TODAY)).toEqual({ start: '2026-06-01', end: '2026-08-11' })
  })
})

describe('flows', () => {
  it('ignores transfers and treats refunds as negative spending', () => {
    expect(flowOf({ amount: -500, categoryId: 'transfer' })).toEqual({ income: 0, expense: 0 })
    expect(flowOf({ amount: 20, categoryId: 'shopping' })).toEqual({ income: 0, expense: -20 })
    expect(flowOf({ amount: 1200, categoryId: 'client-income' })).toEqual({ income: 1200, expense: 0 })
    expect(flowOf({ amount: 75, categoryId: 'uncategorised' })).toEqual({ income: 75, expense: 0 })
  })
})

describe('aggregations', () => {
  const state = stateFor('freelancer')

  it('monthly series adds up to the same totals as the raw transactions', () => {
    const series = monthlySeries(state.transactions, TODAY, 13)
    expect(series).toHaveLength(13)
    expect(series[12].month).toBe('2026-11')
    const income = series.reduce((s, m) => s + m.income, 0)
    expect(income).toBeCloseTo(totals(state.transactions).income, 1)
    for (const m of series) expect(m.net).toBeCloseTo(m.income - m.expenses, 2)
  })

  it('category breakdown is sorted and its shares sum to 1', () => {
    const cats = byCategory(filterByPeriod(state.transactions, 'last-12-months', TODAY))
    expect(cats.length).toBeGreaterThan(5)
    for (let i = 1; i < cats.length; i++) expect(cats[i - 1].total).toBeGreaterThanOrEqual(cats[i].total)
    expect(cats.reduce((s, c) => s + c.share, 0)).toBeCloseTo(1, 6)
    expect(cats.some((c) => c.categoryId === 'transfer')).toBe(false)
  })

  it('computes KPIs and deltas for a period', () => {
    const k = kpis(state, 'last-3-months', TODAY)
    expect(k.net).toBeCloseTo(k.income - k.expenses, 2)
    expect(k.savingsRate).toBeCloseTo(k.net / k.income, 6)
    expect(k.deltas.income).toBeCloseTo((k.income - k.previous.income) / k.previous.income, 6)
  })

  it('excludes the tax reserve from the spendable balance', () => {
    const balances = accountBalances(state, TODAY)
    const tax = balances.find((b) => b.account.purpose === 'tax')!.balance
    const total = balances.reduce((s, b) => s + b.balance, 0)
    expect(liquidBalance(state, TODAY)).toBeCloseTo(total - tax, 2)
  })

  it('returns one daily spend point per day', () => {
    const points = dailySpend(state.transactions, { start: '2026-10-01', end: '2026-10-31' })
    expect(points).toHaveLength(31)
    expect(points.every((p) => p.amount >= 0)).toBe(true)
  })

  it('tracks budgets against the month pace', () => {
    const progress = budgetProgress(state, TODAY, '2026-10')
    expect(progress).toHaveLength(state.budgets.length)
    for (const p of progress) {
      expect(p.remaining).toBeCloseTo(p.limit - p.spent, 2)
      expect(p.status === 'over').toBe(p.spent > p.limit)
    }
  })
})
