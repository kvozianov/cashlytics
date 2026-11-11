import { describe, expect, it } from 'vitest'

import { accountBalances } from '../analytics'
import { invoiceSubtotal, invoiceTaxAmount, invoiceTotal } from '../invoices'
import { demoReducer } from '../reducer'
import { estimateTax, isDeductible } from '../tax'
import { stateFor, TODAY } from './fixtures'

const balanceOf = (state: Parameters<typeof accountBalances>[0], id: string) => accountBalances(state, TODAY).find((b) => b.account.id === id)!.balance

describe('transfer', () => {
  const state = stateFor('freelancer')

  it('moves money between accounts with a pair of transfers', () => {
    const next = demoReducer(state, { type: 'transfer', from: 'checking', to: 'tax', amount: 500, date: TODAY, note: 'Tax set-aside' })
    expect(next.transactions).toHaveLength(state.transactions.length + 2)
    expect(balanceOf(next, 'checking')).toBeCloseTo(balanceOf(state, 'checking') - 500, 2)
    expect(balanceOf(next, 'tax')).toBeCloseTo(balanceOf(state, 'tax') + 500, 2)
    const added = next.transactions.filter((t) => !state.transactions.some((s) => s.id === t.id))
    expect(added.every((t) => t.categoryId === 'transfer' && t.reviewed)).toBe(true)
  })

  it('counts money moved to the tax reserve as set aside', () => {
    const next = demoReducer(state, { type: 'transfer', from: 'checking', to: 'tax', amount: 500, date: TODAY })
    expect(estimateTax(next, 2026, TODAY).setAside - estimateTax(state, 2026, TODAY).setAside).toBeCloseTo(500, 2)
  })

  it('ignores unknown accounts, same-account and non-positive amounts', () => {
    expect(demoReducer(state, { type: 'transfer', from: 'checking', to: 'nope', amount: 10, date: TODAY })).toBe(state)
    expect(demoReducer(state, { type: 'transfer', from: 'checking', to: 'checking', amount: 10, date: TODAY })).toBe(state)
    expect(demoReducer(state, { type: 'transfer', from: 'checking', to: 'tax', amount: 0, date: TODAY })).toBe(state)
  })
})

describe('openTaxReserve', () => {
  it('adds an empty tax account once', () => {
    const state = stateFor('starter')
    const next = demoReducer(state, { type: 'openTaxReserve' })
    const reserve = next.accounts.find((a) => a.purpose === 'tax')!
    expect(reserve).toBeDefined()
    expect(balanceOf(next, reserve.id)).toBe(0)
    expect(demoReducer(next, { type: 'openTaxReserve' })).toBe(next)
    expect(demoReducer(stateFor('freelancer'), { type: 'openTaxReserve' })).toBe(stateFor('freelancer'))
  })
})

describe('markInvoicePaid into a chosen account', () => {
  it('books the income in that account', () => {
    const state = stateFor('freelancer')
    const open = state.invoices.find((i) => i.status === 'sent')!
    const next = demoReducer(state, { type: 'markInvoicePaid', id: open.id, date: TODAY, accountId: 'savings' })
    expect(next.transactions.find((t) => t.invoiceId === open.id)!.accountId).toBe('savings')
    const fallback = demoReducer(state, { type: 'markInvoicePaid', id: open.id, date: TODAY, accountId: 'missing' })
    expect(fallback.transactions.find((t) => t.invoiceId === open.id)!.accountId).toBe('checking')
  })
})

describe('invoice tax', () => {
  const lines = [
    { id: 'a', description: 'Work', quantity: 2, unitPrice: 100 },
    { id: 'b', description: 'More work', quantity: 1, unitPrice: 50.5 },
  ]

  it('adds the tax on top of the subtotal', () => {
    expect(invoiceSubtotal({ lines })).toBe(250.5)
    expect(invoiceTaxAmount({ lines, taxRate: 0.1 })).toBe(25.05)
    expect(invoiceTotal({ lines, taxRate: 0.1 })).toBe(275.55)
    expect(invoiceTotal({ lines })).toBe(250.5)
  })

  it('is stored by addInvoice and editable', () => {
    const state = stateFor('freelancer')
    const next = demoReducer(state, { type: 'addInvoice', invoice: { clientId: 'lumen', issueDate: TODAY, lines, taxRate: 0.1 } })
    const created = next.invoices[0]
    expect(created.taxRate).toBe(0.1)
    const edited = demoReducer(next, { type: 'updateInvoice', id: created.id, patch: { taxRate: 0 } })
    expect(invoiceTotal(edited.invoices.find((i) => i.id === created.id)!)).toBe(250.5)
  })
})

describe('deductible overrides', () => {
  const state = stateFor('freelancer')

  it('defaults to the category setting', () => {
    expect(isDeductible('software')).toBe(true)
    expect(isDeductible('groceries')).toBe(false)
    expect(isDeductible('client-income')).toBe(false)
    expect(isDeductible('software', { deductibleOverrides: { software: false } })).toBe(false)
  })

  it('changes the estimate when a category is switched off', () => {
    const before = estimateTax(state, 2026, TODAY)
    const next = demoReducer(state, { type: 'updateTaxSettings', patch: { deductibleOverrides: { software: false } } })
    const after = estimateTax(next, 2026, TODAY)
    expect(after.deductions).toBeLessThan(before.deductions)
    expect(after.estimatedTax).toBeGreaterThan(before.estimatedTax)
  })
})
