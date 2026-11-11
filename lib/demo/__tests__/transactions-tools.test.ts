import { describe, expect, it } from 'vitest'

import { builtInRules, categorize, KEYWORD_PATTERN_COUNT, needsReview } from '../categorize'
import { parseStatementCsv, sampleStatement } from '../csv'
import { demoReducer } from '../reducer'
import { stateFor, TODAY } from './fixtures'

describe('sampleStatement', () => {
  const parsed = parseStatementCsv(sampleStatement(TODAY))

  it('has 25 rows: 24 readable and one flagged with the reason', () => {
    expect(parsed.rows).toHaveLength(24)
    expect(parsed.errors).toHaveLength(1)
    expect(parsed.errors[0].message).toMatch(/date/i)
    expect(parsed.columns).toEqual({ date: 0, description: 1, amount: 2 })
  })

  it('uses recent dates up to yesterday and reads thousands separators', () => {
    expect(parsed.rows.every((r) => r.date < TODAY && r.date >= '2026-10-01')).toBe(true)
    expect(parsed.rows.find((r) => r.description.includes('ACME'))?.amount).toBe(1250)
  })

  it('sends a few rows to review and sorts the rest', () => {
    const results = parsed.rows.map((r) => categorize(r.description, r.amount))
    const review = results.filter((r) => needsReview({ ...r, reviewed: false }))
    expect(review.length).toBeGreaterThanOrEqual(2)
    expect(review.length).toBeLessThanOrEqual(4)
  })
})

describe('builtInRules', () => {
  const { merchants, keywords } = builtInRules()

  it('lists every keyword pattern and gives the same reason categorize does', () => {
    expect(keywords).toHaveLength(KEYWORD_PATTERN_COUNT)
    const uber = merchants.find((m) => m.match === 'uber')!
    expect(categorize('UBER *TRIP HELP.UBER.COM', -12).reason).toBe(uber.reason)
    const rent = keywords.find((k) => k.keyword === 'rent')!
    expect(categorize('OAKWOOD RENT NOV', -1800).reason).toBe(rent.reason)
  })
})

describe('bulk actions', () => {
  const state = stateFor('freelancer')

  it('sets one category on several transactions', () => {
    const ids = state.transactions.slice(0, 3).map((t) => t.id)
    const next = demoReducer(state, { type: 'recategoriseMany', ids, categoryId: 'gifts' })
    const changed = next.transactions.filter((t) => ids.includes(t.id))
    expect(changed.every((t) => t.categoryId === 'gifts' && t.reviewed && t.reason === 'Chosen by you')).toBe(true)
    expect(next.transactions.filter((t) => !ids.includes(t.id))).toEqual(state.transactions.filter((t) => !ids.includes(t.id)))
    expect(next.edited).toBe(true)
  })

  it('deletes several transactions and reopens linked invoices', () => {
    const paid = state.transactions.find((t) => t.invoiceId)!
    const other = state.transactions.find((t) => !t.invoiceId)!
    const next = demoReducer(state, { type: 'deleteTransactions', ids: [paid.id, other.id] })
    expect(next.transactions).toHaveLength(state.transactions.length - 2)
    expect(next.invoices.find((i) => i.id === paid.invoiceId)?.status).toBe('sent')
    expect(demoReducer(state, { type: 'deleteTransactions', ids: ['missing'] })).toBe(state)
  })
})
