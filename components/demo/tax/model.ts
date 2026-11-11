import { accountBalances } from '@/lib/demo/analytics'
import { getCategory } from '@/lib/demo/categories'
import { endOfMonth, makeISODate } from '@/lib/demo/dates'
import { isDeductible, parseTaxTag, taxOn, type TaxEstimate, type WhatIfResult } from '@/lib/demo/tax'
import type { CategoryId, DemoState, ISODate, TaxSettings, Transaction } from '@/lib/demo/types'

const round2 = (n: number) => Math.round(n * 100) / 100
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface DeductibleRow {
  categoryId: CategoryId
  total: number
  count: number
  deductible: boolean
  /** True when the user changed it from the category default. */
  overridden: boolean
}

/** Business costs this year (and anything the user marked deductible), largest first. */
export function deductibleRows(state: Pick<DemoState, 'transactions' | 'taxSettings'>, year: number, today: ISODate): DeductibleRow[] {
  const from = makeISODate(year, 1, 1)
  const map = new Map<CategoryId, { total: number; count: number }>()
  for (const t of state.transactions) {
    if (t.date < from || t.date > today || t.amount >= 0) continue
    const c = getCategory(t.categoryId)
    if (c.kind !== 'expense' || c.id === 'tax-payment') continue
    const overridden = state.taxSettings.deductibleOverrides?.[c.id] !== undefined
    if (c.group !== 'business' && !overridden) continue
    const row = map.get(c.id) ?? { total: 0, count: 0 }
    row.total -= t.amount
    row.count++
    map.set(c.id, row)
  }
  return [...map.entries()]
    .map(([categoryId, v]) => {
      const overrides = state.taxSettings.deductibleOverrides ?? {}
      return {
        categoryId,
        total: round2(v.total),
        count: v.count,
        deductible: isDeductible(categoryId, state.taxSettings),
        overridden: overrides[categoryId] !== undefined && overrides[categoryId] !== getCategory(categoryId).deductibleByDefault,
      }
    })
    .sort((a, b) => b.total - a.total)
}

/** Taxable income transactions this year, newest first. */
export function recentTaxableIncome(transactions: readonly Transaction[], year: number, today: ISODate, limit = 6): Transaction[] {
  const from = makeISODate(year, 1, 1)
  const out: Transaction[] = []
  for (const t of transactions) {
    if (t.date > today) continue
    if (t.date < from) break
    const c = getCategory(t.categoryId)
    if (c.kind === 'income' && c.taxableByDefault && t.amount > 0) out.push(t)
    if (out.length >= limit) break
  }
  return out
}

export interface CumulativePoint {
  month: string
  label: string
  taxActual: number | null
  taxProjected: number | null
  coveredActual: number | null
  coveredProjected: number | null
}

/**
 * Tax owed so far vs money covering it (paid + in the reserve), month by month through the year.
 * Months up to today use real transactions; later months spread the (what-if) projection evenly.
 */
export function cumulativeSeries(
  state: Pick<DemoState, 'transactions' | 'accounts' | 'taxSettings'>,
  settings: TaxSettings,
  estimate: TaxEstimate,
  projection: Pick<WhatIfResult, 'projectedTaxableIncome' | 'projectedDeductions'>,
  today: ISODate,
): CumulativePoint[] {
  const year = estimate.year
  const currentMonth = Number(today.slice(5, 7))
  const taxAccounts = new Set(state.accounts.filter((a) => a.purpose === 'tax').map((a) => a.id))
  const allowance = settings.allowance ?? 0

  const income = new Array<number>(13).fill(0)
  const deduct = new Array<number>(13).fill(0)
  const paid = new Array<number>(13).fill(0)
  for (const t of state.transactions) {
    if (t.date > today || Number(t.date.slice(0, 4)) !== year) continue
    const m = Number(t.date.slice(5, 7))
    const c = getCategory(t.categoryId)
    if (c.kind === 'income' && c.taxableByDefault) income[m] += t.amount
    else if (isDeductible(c.id, settings)) deduct[m] -= t.amount
    if (c.id === 'tax-payment' && t.amount < 0) {
      const tag = parseTaxTag(t.description)
      if (!tag || tag.year === year) paid[m] -= t.amount
    }
  }

  const rate = estimate.currentSetAsideRate
  const points: CumulativePoint[] = []
  let cumInc = 0
  let cumDed = 0
  let cumPaid = 0
  let lastCovered = 0
  const remainingMonths = 12 - currentMonth
  const incStep = remainingMonths > 0 ? Math.max(0, projection.projectedTaxableIncome - estimate.taxableIncome) / remainingMonths : 0
  const dedStep = remainingMonths > 0 ? Math.max(0, projection.projectedDeductions - estimate.deductions) / remainingMonths : 0

  for (let m = 1; m <= 12; m++) {
    const label = MONTHS[m - 1]
    const month = `${year}-${String(m).padStart(2, '0')}`
    if (m <= currentMonth) {
      cumInc += income[m]
      cumDed += deduct[m]
      cumPaid += paid[m]
      const asOf = m === currentMonth ? today : endOfMonth(`${month}-01`)
      const reserve = accountBalances(state, asOf)
        .filter((b) => taxAccounts.has(b.account.id))
        .reduce((s, b) => s + Math.max(0, b.balance), 0)
      const tax = taxOn(Math.max(0, cumInc - cumDed - allowance), settings)
      lastCovered = round2(cumPaid + reserve)
      points.push({
        month,
        label,
        taxActual: tax,
        coveredActual: lastCovered,
        taxProjected: m === currentMonth ? tax : null,
        coveredProjected: m === currentMonth ? lastCovered : null,
      })
    } else {
      cumInc += incStep
      cumDed += dedStep
      lastCovered = round2(lastCovered + incStep * rate)
      points.push({
        month,
        label,
        taxActual: null,
        coveredActual: null,
        taxProjected: taxOn(Math.max(0, cumInc - cumDed - allowance), settings),
        coveredProjected: lastCovered,
      })
    }
  }
  return points
}

/** Tax the deductions save: tax on profit without them minus tax with them. */
export function taxSavedByDeductions(estimate: TaxEstimate, settings: TaxSettings): number {
  const without = taxOn(Math.max(0, estimate.taxableIncome - (settings.allowance ?? 0)), settings)
  return round2(Math.max(0, without - estimate.estimatedTax))
}
