import { describe, expect, it } from 'vitest'

import { matchesQuery, normaliseQuery, parseAddCommand, searchInvoices, searchLessons, searchTransactions } from '../search'
import { stateFor, TODAY } from './fixtures'

describe('command palette search', () => {
  it('matches every word, in any order, ignoring case', () => {
    expect(matchesQuery('ADOBE *CREATIVE CLOUD Software', normaliseQuery('cloud adobe'))).toBe(true)
    expect(matchesQuery('ADOBE *CREATIVE CLOUD', normaliseQuery('adobe uber'))).toBe(false)
  })

  it('reads "add …" as a quick-add line', () => {
    expect(parseAddCommand('add coffee 4.50')).toBe('coffee 4.50')
    expect(parseAddCommand('  ADD +1200 acme invoice ')).toBe('+1200 acme invoice')
    expect(parseAddCommand('add')).toBeNull()
    expect(parseAddCommand('address')).toBeNull()
    expect(parseAddCommand('coffee 4.50')).toBeNull()
  })

  it('needs two characters before searching data', () => {
    const state = stateFor('freelancer')
    expect(searchTransactions(state, 'a')).toEqual([])
    expect(searchInvoices(state, 'i', TODAY)).toEqual([])
    expect(searchLessons('t')).toEqual([])
  })

  it('returns at most five transactions, newest first', () => {
    const state = stateFor('freelancer')
    const hits = searchTransactions(state, 'adobe')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.length).toBeLessThanOrEqual(5)
    expect(hits.every((t) => `${t.merchant} ${t.description}`.toLowerCase().includes('adobe'))).toBe(true)
    expect([...hits].sort((a, b) => b.date.localeCompare(a.date))).toEqual(hits)
  })

  it('finds invoices by client and by status', () => {
    const state = stateFor('freelancer')
    const late = searchInvoices(state, 'northwind', TODAY)
    expect(late.length).toBeGreaterThan(0)
    expect(late.every((h) => h.clientName.toLowerCase().includes('northwind'))).toBe(true)
    const overdue = searchInvoices(state, 'overdue', TODAY)
    expect(overdue.every((h) => h.status === 'overdue')).toBe(true)
    expect(searchInvoices(state, late[0].invoice.number, TODAY)[0].invoice.id).toBe(late[0].invoice.id)
  })

  it('finds lessons by title before summary', () => {
    const hits = searchLessons('tax')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].title.toLowerCase()).toContain('tax')
    expect(searchLessons('zzzz')).toEqual([])
  })
})
