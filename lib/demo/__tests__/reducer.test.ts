import { describe, expect, it } from 'vitest'

import { accountBalances, totals } from '../analytics'
import { invoiceTotal } from '../invoices'
import { demoReducer } from '../reducer'
import { estimateTax } from '../tax'
import { stateFor, TODAY } from './fixtures'

const base = () => stateFor('freelancer')

describe('markInvoicePaid', () => {
  const state = base()
  const open = state.invoices.find((i) => i.status === 'sent')!
  const next = demoReducer(state, { type: 'markInvoicePaid', id: open.id, date: TODAY })

  it('creates exactly one linked income transaction', () => {
    const linked = next.transactions.filter((t) => t.invoiceId === open.id)
    expect(linked).toHaveLength(1)
    expect(linked[0].amount).toBeCloseTo(invoiceTotal(open), 2)
    expect(linked[0].categoryId).toBe('client-income')
    expect(linked[0].source).toBe('invoice')
    expect(next.transactions).toHaveLength(state.transactions.length + 1)
    const inv = next.invoices.find((i) => i.id === open.id)!
    expect(inv.status).toBe('paid')
    expect(inv.transactionId).toBe(linked[0].id)
  })

  it('raises income and the tax estimate', () => {
    expect(totals(next.transactions).income - totals(state.transactions).income).toBeCloseTo(invoiceTotal(open), 2)
    const delta = estimateTax(next, 2026, TODAY).estimatedTax - estimateTax(state, 2026, TODAY).estimatedTax
    expect(delta).toBeCloseTo(invoiceTotal(open) * 0.2, 1)
  })

  it('is idempotent and marks the state as edited', () => {
    const again = demoReducer(next, { type: 'markInvoicePaid', id: open.id, date: TODAY })
    expect(again).toBe(next)
    expect(next.edited).toBe(true)
    expect(state.edited).toBe(false)
  })

  it('reopens the invoice when its payment is deleted', () => {
    const tx = next.transactions.find((t) => t.invoiceId === open.id)!
    const undone = demoReducer(next, { type: 'deleteTransaction', id: tx.id })
    expect(undone.invoices.find((i) => i.id === open.id)?.status).toBe('sent')
    expect(undone.transactions).toHaveLength(state.transactions.length)
  })
})

describe('transactions and rules', () => {
  it('adds a categorised transaction in date order', () => {
    const next = demoReducer(base(), { type: 'addTransaction', tx: { date: '2026-11-03', description: 'SQ *BLUE BOTTLE 0423', amount: -5.5 } })
    const added = next.transactions.find((t) => t.source === 'manual')!
    expect(added.categoryId).toBe('dining')
    const dates = next.transactions.map((t) => t.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('recategorises with a rule and updates similar transactions', () => {
    const state = base()
    const target = state.transactions.find((t) => t.merchant === 'Sightglass Coffee')!
    const similar = state.transactions.filter((t) => t.merchant === 'Sightglass Coffee').length
    const next = demoReducer(state, { type: 'recategorise', id: target.id, categoryId: 'software', createRule: true })
    const after = next.transactions.filter((t) => t.merchant === 'Sightglass Coffee')
    expect(after).toHaveLength(similar)
    expect(after.every((t) => t.categoryId === 'software')).toBe(true)
    expect(next.transactions.find((t) => t.id === target.id)?.reviewed).toBe(true)
    expect(next.rules[0]).toMatchObject({ match: 'exact', pattern: 'Sightglass Coffee', categoryId: 'software' })
  })

  it('reverts rule-based categories when the rule is removed', () => {
    const state = base()
    const withRule = demoReducer(state, { type: 'addRule', rule: { match: 'contains', pattern: 'netflix', categoryId: 'entertainment' } })
    expect(withRule.transactions.filter((t) => t.merchant === 'Netflix').every((t) => t.categoryId === 'entertainment')).toBe(true)
    const removed = demoReducer(withRule, { type: 'removeRule', id: withRule.rules[0].id })
    expect(removed.transactions.filter((t) => t.merchant === 'Netflix').every((t) => t.categoryId === 'subscriptions')).toBe(true)
  })

  it('skips duplicates on import', () => {
    const state = base()
    const existing = state.transactions[0]
    const next = demoReducer(state, {
      type: 'importTransactions',
      rows: [
        { date: existing.date, description: existing.description, amount: existing.amount },
        { date: '2026-11-02', description: 'POS RIVERSIDE HARDWARE', amount: -42.1 },
      ],
    })
    expect(next.transactions.length).toBe(state.transactions.length + 1)
    expect(next.transactions.find((t) => t.source === 'import')?.description).toBe('POS RIVERSIDE HARDWARE')
  })
})

describe('plans and tax', () => {
  it('moves money between accounts when contributing to a goal', () => {
    const state = base()
    const goal = state.goals.find((g) => g.accountId)!
    const next = demoReducer(state, { type: 'contributeToGoal', id: goal.id, amount: 250, date: TODAY })
    const balance = (s: typeof state, id: string) => accountBalances(s).find((b) => b.account.id === id)!.balance
    expect(balance(next, goal.accountId!) - balance(state, goal.accountId!)).toBeCloseTo(250, 2)
    expect(balance(next, 'checking') - balance(state, 'checking')).toBeCloseTo(-250, 2)
    expect(next.goals.find((g) => g.id === goal.id)!.saved).toBeCloseTo(goal.saved + 250, 2)
  })

  it('records a tax payment that counts towards the year', () => {
    const state = base()
    const next = demoReducer(state, { type: 'recordTaxPayment', year: 2026, quarter: 3, amount: 1_500, date: TODAY })
    expect(estimateTax(next, 2026, TODAY).paid - estimateTax(state, 2026, TODAY).paid).toBeCloseTo(1_500, 2)
  })

  it('sets and removes budgets', () => {
    const state = base()
    const set = demoReducer(state, { type: 'setBudget', categoryId: 'travel', monthlyLimit: 300 })
    expect(set.budgets.find((b) => b.categoryId === 'travel')?.monthlyLimit).toBe(300)
    const removed = demoReducer(set, { type: 'setBudget', categoryId: 'travel', monthlyLimit: null })
    expect(removed.budgets.some((b) => b.categoryId === 'travel')).toBe(false)
  })

  it('numbers new invoices after the highest one', () => {
    const state = base()
    const next = demoReducer(state, {
      type: 'addInvoice',
      invoice: { clientId: 'pollen', issueDate: TODAY, lines: [{ description: 'Icons', quantity: 2, unitPrice: 150 }] },
    })
    const max = Math.max(...state.invoices.map((i) => Number(i.number.slice(4))))
    expect(next.invoices[0].number).toBe(`INV-${String(max + 1).padStart(3, '0')}`)
    expect(next.invoices[0].dueDate).toBe('2026-11-25')
  })

  it('does not mark the state as edited when only the period changes', () => {
    const next = demoReducer(base(), { type: 'setPeriod', period: 'ytd' })
    expect(next.period).toBe('ytd')
    expect(next.edited).toBe(false)
  })
})
