import { describe, expect, it } from 'vitest'

import { parseQuickAdd } from '../quick-add'
import { TODAY } from './fixtures'

describe('parseQuickAdd', () => {
  it('parses "coffee 4.50 yesterday"', () => {
    expect(parseQuickAdd('coffee 4.50 yesterday', TODAY)).toEqual({ description: 'Coffee', amount: -4.5, date: '2026-11-10', kind: 'expense' })
  })

  it('parses "+1200 acme invoice" as income today', () => {
    expect(parseQuickAdd('+1200 acme invoice', TODAY)).toEqual({ description: 'Acme invoice', amount: 1200, date: TODAY, kind: 'income' })
  })

  it('parses "uber 18 on 3 nov"', () => {
    expect(parseQuickAdd('uber 18 on 3 nov', TODAY)).toEqual({ description: 'Uber', amount: -18, date: '2026-11-03', kind: 'expense' })
  })

  it('understands other date forms', () => {
    expect(parseQuickAdd('groceries 62.40 saturday', TODAY)?.date).toBe('2026-11-07')
    expect(parseQuickAdd('lunch 12 2 days ago', TODAY)?.date).toBe('2026-11-09')
    expect(parseQuickAdd('books 30 on dec 20', TODAY)?.date).toBe('2025-12-20')
    expect(parseQuickAdd('rent 1,450 on 2026-11-01', TODAY)).toMatchObject({ amount: -1450, date: '2026-11-01', description: 'Rent' })
  })

  it('accepts dollar signs and decimal commas', () => {
    expect(parseQuickAdd('taxi $23.10', TODAY)?.amount).toBe(-23.1)
    expect(parseQuickAdd('bakery 4,50', TODAY)?.amount).toBe(-4.5)
  })

  it('treats income words as money in', () => {
    expect(parseQuickAdd('refund 25 amazon', TODAY)?.kind).toBe('income')
  })

  it('returns null without an amount', () => {
    expect(parseQuickAdd('coffee yesterday', TODAY)).toBeNull()
    expect(parseQuickAdd('   ', TODAY)).toBeNull()
  })
})
