import { describe, expect, it } from 'vitest'

import { ageingBuckets, clientStats, daysLate, daysOverdue, invoiceStatus, invoiceTotal, nextInvoiceNumber, receivablesSummary } from '../invoices'
import type { Invoice } from '../types'
import { stateFor, TODAY } from './fixtures'

const inv = (over: Partial<Invoice>): Invoice => ({
  id: 'i1',
  number: 'INV-001',
  clientId: 'c1',
  issueDate: '2026-09-01',
  dueDate: '2026-10-01',
  lines: [
    { id: 'l1', description: 'Design', quantity: 10, unitPrice: 100 },
    { id: 'l2', description: 'Testing', quantity: 1, unitPrice: 250.5 },
  ],
  status: 'sent',
  ...over,
})

describe('invoices', () => {
  it('totals the lines', () => {
    expect(invoiceTotal(inv({}))).toBe(1250.5)
  })

  it('derives overdue from the due date', () => {
    expect(invoiceStatus(inv({}), TODAY)).toBe('overdue')
    expect(invoiceStatus(inv({ dueDate: '2026-12-01' }), TODAY)).toBe('sent')
    expect(invoiceStatus(inv({ status: 'paid' }), TODAY)).toBe('paid')
    expect(daysOverdue(inv({}), TODAY)).toBe(41)
    expect(daysLate(inv({ paidDate: '2026-10-11' }))).toBe(10)
  })

  it('groups unpaid invoices into ageing buckets', () => {
    const buckets = ageingBuckets([inv({}), inv({ id: 'i2', dueDate: '2026-12-01' }), inv({ id: 'i3', status: 'paid' })], TODAY)
    expect(buckets.find((b) => b.id === '31-60')).toMatchObject({ count: 1, amount: 1250.5 })
    expect(buckets.find((b) => b.id === 'current')?.count).toBe(1)
    expect(buckets.reduce((s, b) => s + b.count, 0)).toBe(2)
  })

  it('continues the number sequence', () => {
    expect(nextInvoiceNumber([{ number: 'INV-009' }, { number: 'INV-041' }])).toBe('INV-042')
    expect(nextInvoiceNumber([])).toBe('INV-001')
  })

  it('summarises what the freelancer is owed', () => {
    const state = stateFor('freelancer')
    const r = receivablesSummary(state.invoices, TODAY)
    expect(r.overdue).toBeGreaterThan(0)
    expect(r.outstanding).toBeGreaterThanOrEqual(r.overdue)
    expect(r.draftCount).toBe(1)
    const northwind = clientStats(state, TODAY).find((s) => s.client.id === 'northwind')!
    const lumen = clientStats(state, TODAY).find((s) => s.client.id === 'lumen')!
    expect(northwind.avgDaysLate!).toBeGreaterThanOrEqual(25)
    expect(lumen.avgDaysLate!).toBeLessThanOrEqual(5)
  })
})
