import { describe, expect, it } from 'vitest'

import { categorize, needsReview, normaliseMerchant, REVIEW_THRESHOLD } from '../categorize'
import type { CategoryRule } from '../types'

describe('normaliseMerchant', () => {
  it.each([
    ['SQ *BLUE BOTTLE 0423', 'Blue Bottle Coffee'],
    ['UBER *TRIP HELP.UBER.COM', 'Uber'],
    ['UBER *EATS PENDING', 'Uber Eats'],
    ['ADOBE *CREATIVE CLOUD', 'Adobe'],
    ['AMZN MKTP US*2K4LT0QZ1', 'Amazon'],
    ['ROASTWORKS COFFEE CO #2231', 'Roastworks Coffee Co'],
    ["POS KIM'S MARKET", "Kim's Market"],
    ['ACH CREDIT NORTHWIND LOGISTI PAYMENTS 260312', 'Northwind Logisti'],
    ['TST* LA TAQUERIA SF', 'La Taqueria Sf'],
  ])('%s → %s', (raw, expected) => {
    expect(normaliseMerchant(raw)).toBe(expected)
  })

  it('gives the same merchant for different reference numbers', () => {
    expect(normaliseMerchant('SQ *RIVERSIDE POP UP 8812')).toBe(normaliseMerchant('SQ *RIVERSIDE POP UP 1203'))
  })
})

describe('categorize', () => {
  it('uses the merchant dictionary with a readable reason', () => {
    const r = categorize('UBER *TRIP HELP.UBER.COM', -18.4)
    expect(r.categoryId).toBe('transport')
    expect(r.confidence).toBeGreaterThanOrEqual(0.9)
    expect(r.reason).toBe('Matched "uber" → Transport')
  })

  it('checks more specific merchants first', () => {
    expect(categorize('UBER *EATS PENDING', -24).categoryId).toBe('dining')
  })

  it('falls back to keywords with lower confidence', () => {
    const r = categorize('ACH DEBIT PARKVIEW PROP MGMT RENT', -2150)
    expect(r.categoryId).toBe('housing')
    expect(r.reason).toMatch(/^Keyword/)
    expect(r.confidence).toBeLessThan(0.9)
  })

  it('takes the sign of the amount into account', () => {
    expect(categorize('SQUARE INC DEPOSIT 261103', 512.4).categoryId).toBe('sales')
    expect(categorize('BRIGHTPATH ANALYTI PAYROLL PPD', 1742.36).categoryId).toBe('salary')
    expect(categorize('GUSTO PAY 123456 BREW BLOOM', -2350).categoryId).toBe('payroll')
  })

  it('marks unknown merchants as uncategorised with low confidence', () => {
    const r = categorize('CITY OF OAKVIEW BUSINESS LIC', -420)
    expect(r.categoryId).toBe('uncategorised')
    expect(r.confidence).toBeLessThan(REVIEW_THRESHOLD)
  })

  it('lets user rules win over the dictionary', () => {
    const rules: CategoryRule[] = [{ id: 'r1', match: 'contains', pattern: 'amzn', categoryId: 'equipment' }]
    const r = categorize('AMZN MKTP US*2K4LT0QZ1', -89, rules)
    expect(r.categoryId).toBe('equipment')
    expect(r.reason).toContain('Your rule')
  })

  it('matches exact rules against the normalised merchant only', () => {
    const rules: CategoryRule[] = [{ id: 'r1', match: 'exact', pattern: 'blue bottle coffee', categoryId: 'software' }]
    expect(categorize('SQ *BLUE BOTTLE 0423', -5, rules).categoryId).toBe('software')
    expect(categorize('BLUE BOTTLE BEANS SUBSCRIPTION', -5, [{ ...rules[0], pattern: 'blue bottle' }]).categoryId).toBe('dining')
  })

  it('never applies an income rule to money going out', () => {
    const rules: CategoryRule[] = [{ id: 'r1', match: 'contains', pattern: 'northwind', categoryId: 'client-income' }]
    expect(categorize('NORTHWIND LOGISTICS REFUND', -50, rules).categoryId).not.toBe('client-income')
  })
})

describe('needsReview', () => {
  it('flags low confidence and uncategorised items until reviewed', () => {
    expect(needsReview({ confidence: 0.5, reviewed: false, categoryId: 'dining' })).toBe(true)
    expect(needsReview({ confidence: 0.9, reviewed: false, categoryId: 'uncategorised' })).toBe(true)
    expect(needsReview({ confidence: 0.92, reviewed: false, categoryId: 'dining' })).toBe(false)
    expect(needsReview({ confidence: 0.2, reviewed: true, categoryId: 'dining' })).toBe(false)
  })
})
