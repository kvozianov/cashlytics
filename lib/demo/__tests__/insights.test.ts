import { describe, expect, it } from 'vitest'

import { anomalies, detectSubscriptions, forecast, healthScore, weakPoints } from '../insights'
import { getLesson } from '../lessons'
import { PERSONAS, stateFor, TODAY } from './fixtures'

describe('healthScore', () => {
  it.each(PERSONAS)('stays in range with weights that sum to 1 for %s', (persona) => {
    const h = healthScore(stateFor(persona), TODAY)
    expect(h.score).toBeGreaterThanOrEqual(0)
    expect(h.score).toBeLessThanOrEqual(100)
    expect(h.components.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1, 6)
    for (const c of h.components) expect(c.detail.length).toBeGreaterThan(10)
  })

  it('only scores receivables when there are invoices', () => {
    const withoutInvoices = { ...stateFor('starter'), invoices: [] }
    expect(healthScore(withoutInvoices, TODAY).components.map((c) => c.id)).not.toContain('receivables')
    expect(healthScore(stateFor('freelancer'), TODAY).components.map((c) => c.id)).toContain('receivables')
  })
})

describe('weakPoints', () => {
  it.each(PERSONAS)('are sorted by impact and point to real pages and lessons for %s', (persona) => {
    const points = weakPoints(stateFor(persona), TODAY)
    expect(points.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < points.length; i++) expect(points[i - 1].impact).toBeGreaterThanOrEqual(points[i].impact)
    for (const p of points) {
      expect(p.action.href.startsWith('/demo')).toBe(true)
      expect(getLesson(p.lessonId)).toBeDefined()
      expect(p.detail).toMatch(/\d/)
    }
  })

  it('names the late client with real numbers', () => {
    const late = weakPoints(stateFor('freelancer'), TODAY).find((p) => p.id === 'late-payer')!
    expect(late.title).toContain('Northwind')
    expect(late.detail).toMatch(/\d+ days after the due date/)
  })
})

describe('detectSubscriptions', () => {
  const subs = detectSubscriptions(stateFor('starter'), TODAY)

  it('finds monthly subscriptions and their price rises', () => {
    const netflix = subs.find((s) => s.merchant === 'Netflix')!
    expect(netflix.cadence).toBe('monthly')
    expect(netflix.priceChange).toMatchObject({ from: 15.49, to: 17.99 })
    expect(subs.filter((s) => s.active).length).toBeGreaterThanOrEqual(10)
  })

  it('does not treat groceries or rides as subscriptions', () => {
    expect(subs.some((s) => s.categoryId === 'groceries' || s.categoryId === 'transport')).toBe(false)
    for (const s of subs) expect(s.yearlyCost).toBeCloseTo(s.monthlyCost * 12, 1)
  })
})

describe('anomalies and forecast', () => {
  it('reports only categories well above their recent average', () => {
    for (const a of anomalies(stateFor('starter'), TODAY)) {
      expect(a.amount).toBeGreaterThan(a.average * 1.35)
      expect(a.month).toBe('2026-10')
    }
  })

  it('projects the balance month by month', () => {
    const f = forecast(stateFor('business'), TODAY, 3)
    expect(f.points).toHaveLength(3)
    expect(f.points[0].month).toBe('2026-12')
    expect(f.endBalance).toBeCloseTo(f.startBalance + 3 * f.monthlyNet, 1)
    const worse = forecast(stateFor('business'), TODAY, 3, { incomeChangePct: -0.2, extraMonthlyCost: 500 })
    expect(worse.monthlyNet).toBeLessThan(f.monthlyNet)
    expect(worse.runwayMonths).not.toBeNull()
  })
})
