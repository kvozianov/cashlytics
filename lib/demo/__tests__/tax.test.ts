import { describe, expect, it } from 'vitest'

import { estimateTax, marginalRate, parseTaxTag, quarterDueDate, taxOn, whatIf } from '../tax'
import { stateFor, TODAY } from './fixtures'

describe('tax maths', () => {
  it('applies a flat rate', () => {
    expect(taxOn(10_000, { rate: 0.2 })).toBe(2_000)
    expect(taxOn(-500, { rate: 0.2 })).toBe(0)
  })

  it('applies progressive brackets band by band', () => {
    const brackets = [
      { upTo: 10_000, rate: 0 },
      { upTo: 40_000, rate: 0.2 },
      { upTo: null, rate: 0.4 },
    ]
    expect(taxOn(5_000, { rate: 0, brackets })).toBe(0)
    expect(taxOn(30_000, { rate: 0, brackets })).toBe(4_000)
    expect(taxOn(50_000, { rate: 0, brackets })).toBe(10_000)
    expect(marginalRate(50_000, { rate: 0, brackets })).toBe(0.4)
  })

  it('knows the illustrative quarterly due dates', () => {
    expect(quarterDueDate(2026, 1)).toBe('2026-04-15')
    expect(quarterDueDate(2026, 3)).toBe('2026-10-15')
    expect(quarterDueDate(2026, 4)).toBe('2027-01-15')
  })

  it('reads quarter tags from payment descriptions', () => {
    expect(parseTaxTag('EST TAX PMT 2026 Q2 TAX OFFICE')).toEqual({ year: 2026, quarter: 2 })
    expect(parseTaxTag('Tax Q3 2025')).toEqual({ year: 2025, quarter: 3 })
    expect(parseTaxTag('Coffee')).toBeNull()
  })
})

describe('estimateTax', () => {
  const state = stateFor('freelancer')
  const est = estimateTax(state, 2026, TODAY)

  it('keeps its numbers consistent', () => {
    expect(est.base).toBeCloseTo(Math.max(0, est.taxableIncome - est.deductions - est.allowance), 2)
    expect(est.estimatedTax).toBeCloseTo(est.base * 0.2, 2)
    expect(est.shortfall).toBeCloseTo(Math.max(0, est.estimatedTax - est.paid - est.setAside), 2)
    expect(est.quarters).toHaveLength(4)
    expect(est.quarters.reduce((s, q) => s + q.amount, 0)).toBeGreaterThan(est.estimatedTax - 1)
  })

  it('counts only payments tagged for the year', () => {
    // The Q4 2025 payment made in January belongs to 2025.
    const jan = state.transactions.find((t) => t.categoryId === 'tax-payment' && t.description.includes('2025 Q4'))
    expect(jan?.date.startsWith('2026-01')).toBe(true)
    const tagged2026 = state.transactions.filter((t) => t.categoryId === 'tax-payment' && t.description.includes('2026')).reduce((s, t) => s - t.amount, 0)
    expect(est.paid).toBeCloseTo(tagged2026, 2)
  })

  it('shows the freelancer under-reserving for tax', () => {
    expect(est.currentSetAsideRate).toBeLessThan(est.suggestedSetAsideRate)
    expect(est.projectedShortfall).toBeGreaterThan(1_000)
    expect(est.quarters.find((q) => q.quarter === 3)?.status).toBe('overdue')
    expect(est.quarters.find((q) => q.quarter === 4)?.status).toBe('upcoming')
  })

  it('treats salary as untaxed for the starter persona', () => {
    const starter = estimateTax(stateFor('starter'), 2026, TODAY)
    const salary = stateFor('starter').transactions.filter((t) => t.categoryId === 'salary').reduce((s, t) => s + t.amount, 0)
    expect(salary).toBeGreaterThan(30_000)
    expect(starter.taxableIncome).toBeLessThan(8_000)
  })

  it('runs what-if scenarios on the full-year projection', () => {
    const more = whatIf(est, state.taxSettings, { incomeDeltaPct: 0.1 })
    const deduct = whatIf(est, state.taxSettings, { extraDeductible: 1_000 })
    expect(more.delta).toBeCloseTo(est.projectedTaxableIncome * 0.1 * 0.2, 0)
    expect(deduct.delta).toBeCloseTo(-200, 2)
    expect(whatIf(est, state.taxSettings, {}).delta).toBe(0)
  })
})
