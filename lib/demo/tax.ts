import { getCategory } from './categories'
import { accountBalances } from './analytics'
import { addDays, diffDays, makeISODate, minDate } from './dates'
import { parseTaxTag, quarterDueDate, quarterEnd, quarterStart, type Quarter } from './tax-dates'
import type { CategoryId, DemoState, ISODate, TaxSettings, Transaction } from './types'

export { quarterDueDate, quarterEnd, quarterStart, parseTaxTag, taxPaymentDescription, type Quarter } from './tax-dates'

// Illustrative maths only: a generic profit-based estimate, not the rules of any country.

export type QuarterStatus = 'paid' | 'due' | 'upcoming' | 'overdue'

export interface TaxQuarter {
  quarter: Quarter
  /** `Q1 2026` */
  label: string
  periodStart: ISODate
  periodEnd: ISODate
  dueDate: ISODate
  /** Estimated tax for the quarter (actual profit for past quarters, projected for future ones). */
  amount: number
  paid: number
  status: QuarterStatus
}

export interface TaxEstimate {
  year: number
  /** Last date included: today for the current year, 31 Dec for past years. */
  throughDate: ISODate
  taxableIncome: number
  deductions: number
  allowance: number
  /** Taxable profit after deductions and allowance. */
  base: number
  /** Flat rate, or the top marginal rate reached when brackets are used. */
  rate: number
  /** Tax on the profit so far this year. */
  estimatedTax: number
  projectedTaxableIncome: number
  projectedDeductions: number
  projectedBase: number
  /** Tax on the full year if the pace so far continues. */
  projectedAnnualTax: number
  /** Tax payments made for this year. */
  paid: number
  /** Money parked in tax-reserve accounts. */
  setAside: number
  /** max(0, estimatedTax − paid − setAside) */
  shortfall: number
  /** Unpaid part of quarters already past their due date. */
  overdueAmount: number
  /** Share of taxable income moved into tax reserves over the last 12 months. */
  currentSetAsideRate: number
  /** Year-end gap if you keep setting aside at `currentSetAsideRate`. */
  projectedShortfall: number
  /** Share of taxable income to put aside to cover the projected tax, rounded up to whole percent. */
  suggestedSetAsideRate: number
  /** estimatedTax / taxableIncome */
  effectiveRate: number
  quarters: TaxQuarter[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Tax due on a taxable base under the settings (flat rate or progressive brackets). */
export function taxOn(base: number, settings: Pick<TaxSettings, 'rate' | 'brackets'>): number {
  if (base <= 0) return 0
  if (!settings.brackets?.length) return round2(base * settings.rate)
  let tax = 0
  let lower = 0
  for (const band of settings.brackets) {
    const upper = band.upTo ?? Infinity
    if (base > lower) tax += (Math.min(base, upper) - lower) * band.rate
    lower = upper
    if (base <= upper) break
  }
  return round2(tax)
}

/** Rate applied to the last dollar of `base`. */
export function marginalRate(base: number, settings: Pick<TaxSettings, 'rate' | 'brackets'>): number {
  if (!settings.brackets?.length) return settings.rate
  const band = settings.brackets.find((b) => b.upTo === null || base <= b.upTo)
  return band?.rate ?? settings.brackets[settings.brackets.length - 1].rate
}

export function isTaxPayment(tx: Pick<Transaction, 'categoryId'>): boolean {
  return tx.categoryId === 'tax-payment'
}

/** Whether costs in a category reduce taxable profit, honouring the user's overrides. */
export function isDeductible(categoryId: CategoryId, settings?: Pick<TaxSettings, 'deductibleOverrides'>): boolean {
  const c = getCategory(categoryId)
  if (c.kind !== 'expense' || categoryId === 'tax-payment') return false
  return settings?.deductibleOverrides?.[categoryId] ?? c.deductibleByDefault
}

function profitParts(transactions: readonly Transaction[], from: ISODate, to: ISODate, settings?: Pick<TaxSettings, 'deductibleOverrides'>) {
  let taxableIncome = 0
  let deductions = 0
  for (const t of transactions) {
    if (t.date < from || t.date > to) continue
    const c = getCategory(t.categoryId)
    if (c.kind === 'income' && c.taxableByDefault) taxableIncome += t.amount
    else if (c.kind === 'expense' && isDeductible(c.id, settings)) deductions -= t.amount
  }
  return { taxableIncome: round2(taxableIncome), deductions: round2(deductions) }
}

/** Payments that belong to `year`: tagged `2026 Q1` in the description, otherwise by payment date. */
export function taxPaymentsForYear(transactions: readonly Transaction[], year: number) {
  const tagged = new Map<Quarter, number>()
  let untagged = 0
  for (const t of transactions) {
    if (!isTaxPayment(t) || t.amount >= 0) continue
    const tag = parseTaxTag(t.description)
    if (tag) {
      if (tag.year === year) tagged.set(tag.quarter, (tagged.get(tag.quarter) ?? 0) - t.amount)
    } else if (Number(t.date.slice(0, 4)) === year) {
      untagged -= t.amount
    }
  }
  return { tagged, untagged }
}

function yearFraction(year: number, through: ISODate): number {
  const start = makeISODate(year, 1, 1)
  const days = diffDays(makeISODate(year + 1, 1, 1), start)
  return Math.min(1, Math.max(1 / days, (diffDays(through, start) + 1) / days))
}

export function estimateTax(state: Pick<DemoState, 'transactions' | 'accounts' | 'taxSettings'>, year: number, today: ISODate): TaxEstimate {
  const settings = state.taxSettings
  const yearStart = makeISODate(year, 1, 1)
  const throughDate = minDate(today, makeISODate(year, 12, 31))
  const { taxableIncome, deductions } = profitParts(state.transactions, yearStart, throughDate, settings)
  const allowance = settings.allowance ?? 0
  const base = Math.max(0, round2(taxableIncome - deductions - allowance))
  const estimatedTax = taxOn(base, settings)

  // Full-year projection: this year's pace, or the last 12 months early in the year when the pace is noise.
  const fraction = yearFraction(year, throughDate)
  const trailing = profitParts(state.transactions, addDays(throughDate, -364), throughDate, settings)
  const early = fraction < 0.25
  const projectedTaxableIncome = round2(early ? Math.max(taxableIncome, trailing.taxableIncome) : taxableIncome / fraction)
  const projectedDeductions = round2(early ? Math.max(deductions, trailing.deductions) : deductions / fraction)
  const projectedBase = Math.max(0, round2(projectedTaxableIncome - projectedDeductions - allowance))
  const projectedAnnualTax = taxOn(projectedBase, settings)

  const { tagged, untagged } = taxPaymentsForYear(state.transactions, year)
  const paid = round2([...tagged.values()].reduce((s, v) => s + v, 0) + untagged)
  const isCurrentYear = today.slice(0, 4) === String(year)
  const setAside = isCurrentYear
    ? round2(
        accountBalances(state, today)
          .filter((b) => b.account.purpose === 'tax')
          .reduce((s, b) => s + Math.max(0, b.balance), 0),
      )
    : 0

  // Quarter amounts: cumulative tax at each quarter end, actual where known, projected otherwise.
  const quarters: TaxQuarter[] = []
  let previousCumulativeTax = 0
  let spareUntagged = untagged
  let nextOpenMarked = false
  for (const q of [1, 2, 3, 4] as Quarter[]) {
    const periodStart = quarterStart(year, q)
    const periodEnd = quarterEnd(year, q)
    let cumulativeBase: number
    if (periodEnd <= throughDate) {
      const p = profitParts(state.transactions, yearStart, periodEnd, settings)
      cumulativeBase = Math.max(0, p.taxableIncome - p.deductions - allowance)
    } else {
      cumulativeBase = Math.max(base, projectedBase * (q / 4))
    }
    const cumulativeTax = taxOn(cumulativeBase, settings)
    const amount = round2(Math.max(0, cumulativeTax - previousCumulativeTax))
    previousCumulativeTax = Math.max(previousCumulativeTax, cumulativeTax)

    let paidForQuarter = tagged.get(q) ?? 0
    if (paidForQuarter < amount && spareUntagged > 0) {
      const use = Math.min(spareUntagged, amount - paidForQuarter)
      paidForQuarter += use
      spareUntagged -= use
    }
    const dueDate = quarterDueDate(year, q)
    let status: QuarterStatus
    if (amount > 0 && amount - paidForQuarter <= Math.max(1, amount * 0.05)) status = 'paid'
    else if (amount === 0 && dueDate < today) status = 'paid'
    else if (dueDate < today) status = 'overdue'
    else if (!nextOpenMarked && diffDays(dueDate, today) <= 45) status = 'due'
    else status = 'upcoming'
    if (status === 'due' || (status === 'upcoming' && !nextOpenMarked)) nextOpenMarked = true
    quarters.push({ quarter: q, label: `Q${q} ${year}`, periodStart, periodEnd, dueDate, amount, paid: round2(paidForQuarter), status })
  }

  const overdueAmount = round2(quarters.filter((q) => q.status === 'overdue').reduce((s, q) => s + Math.max(0, q.amount - q.paid), 0))
  const taxAccounts = new Set(state.accounts.filter((a) => a.purpose === 'tax').map((a) => a.id))
  let movedToReserve = 0
  const since = addDays(today, -364)
  for (const t of state.transactions) {
    if (taxAccounts.has(t.accountId) && t.categoryId === 'transfer' && t.amount > 0 && t.date >= since && t.date <= today) movedToReserve += t.amount
  }
  const trailingToday = profitParts(state.transactions, since, today, settings)
  const currentSetAsideRate = trailingToday.taxableIncome > 0 ? movedToReserve / trailingToday.taxableIncome : 0
  const stillToEarn = Math.max(0, projectedTaxableIncome - taxableIncome)
  const projectedShortfall = round2(Math.max(0, projectedAnnualTax - paid - setAside - currentSetAsideRate * stillToEarn))

  return {
    year,
    throughDate,
    taxableIncome,
    deductions,
    allowance,
    base,
    rate: marginalRate(base, settings),
    estimatedTax,
    projectedTaxableIncome,
    projectedDeductions,
    projectedBase,
    projectedAnnualTax,
    paid,
    setAside,
    shortfall: round2(Math.max(0, estimatedTax - paid - setAside)),
    overdueAmount,
    currentSetAsideRate,
    projectedShortfall,
    suggestedSetAsideRate: projectedTaxableIncome > 0 ? Math.ceil((projectedAnnualTax / projectedTaxableIncome) * 100) / 100 : 0,
    effectiveRate: taxableIncome > 0 ? estimatedTax / taxableIncome : 0,
    quarters,
  }
}

export interface WhatIfInput {
  /** Change in taxable income for the rest of the year, e.g. 0.1 = +10 %. */
  incomeDeltaPct?: number
  /** Extra deductible business costs over the full year, USD. */
  extraDeductible?: number
}

export interface WhatIfResult {
  projectedTaxableIncome: number
  projectedDeductions: number
  projectedBase: number
  projectedAnnualTax: number
  /** Difference from the current projection (positive = more tax). */
  delta: number
}

/** Re-runs the full-year projection with different income or costs. */
export function whatIf(estimate: TaxEstimate, settings: Pick<TaxSettings, 'rate' | 'brackets' | 'allowance'>, input: WhatIfInput): WhatIfResult {
  const income = round2(estimate.projectedTaxableIncome * (1 + (input.incomeDeltaPct ?? 0)))
  const deductions = round2(estimate.projectedDeductions + (input.extraDeductible ?? 0))
  const base = Math.max(0, round2(income - deductions - (settings.allowance ?? 0)))
  const tax = taxOn(base, settings)
  return {
    projectedTaxableIncome: income,
    projectedDeductions: deductions,
    projectedBase: base,
    projectedAnnualTax: tax,
    delta: round2(tax - estimate.projectedAnnualTax),
  }
}

/** The next quarter that still needs money (overdue first), if any. */
export function nextTaxDue(estimate: TaxEstimate): TaxQuarter | undefined {
  return estimate.quarters.find((q) => q.status === 'overdue') ?? estimate.quarters.find((q) => q.status === 'due' || q.status === 'upcoming')
}
