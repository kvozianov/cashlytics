import { describe, expect, it } from 'vitest'

import { accountBalances, balanceSeries } from '../analytics'
import { isCategoryId } from '../categories'
import { categorize, needsReview } from '../categorize'
import { generateState, windowStart } from '../generate'
import { invoiceTotal } from '../invoices'
import { getPersona } from '../personas'
import { weakPoints } from '../insights'
import { PERSONAS, stateFor, TODAY } from './fixtures'

describe('generateState', () => {
  it.each(PERSONAS)('is deterministic for %s and the same date', (persona) => {
    expect(generateState(persona, TODAY)).toEqual(generateState(persona, TODAY))
  })

  it('keeps the same history for two days in the same month', () => {
    const early = generateState('freelancer', '2026-11-05')
    const late = generateState('freelancer', '2026-11-20')
    const strip = (txs: typeof early.transactions) => txs.map((t) => ({ ...t, id: '' }))
    const lateUpToEarly = late.transactions.filter((t) => t.date <= '2026-11-05')
    expect(strip(lateUpToEarly)).toEqual(strip(early.transactions))
  })

  it('differs between personas', () => {
    expect(stateFor('freelancer').transactions[0]).not.toEqual(stateFor('starter').transactions[0])
  })

  it.each(PERSONAS)('produces a realistic volume of transactions for %s', (persona) => {
    for (const today of [TODAY, '2026-03-20', '2027-01-05']) {
      const n = stateFor(persona, today).transactions.length
      expect(n).toBeGreaterThanOrEqual(450)
      expect(n).toBeLessThanOrEqual(1000)
    }
  })

  it.each(PERSONAS)('only uses valid categories and dates inside the window for %s', (persona) => {
    const state = stateFor(persona)
    const start = windowStart(TODAY)
    for (const t of state.transactions) {
      expect(isCategoryId(t.categoryId)).toBe(true)
      expect(t.date >= start && t.date <= TODAY).toBe(true)
      expect(Number.isFinite(t.amount) && t.amount !== 0).toBe(true)
    }
    expect(new Set(state.transactions.map((t) => t.id)).size).toBe(state.transactions.length)
  })

  it.each(PERSONAS)('sends every transaction through the categoriser for %s', (persona) => {
    const state = stateFor(persona)
    const rules = getPersona(persona).rules
    for (const t of state.transactions) {
      expect(t.categoryId).toBe(categorize(t.description, t.amount, rules).categoryId)
    }
  })

  it.each(PERSONAS)('keeps transactions sorted newest first for %s', (persona) => {
    const dates = stateFor(persona).transactions.map((t) => t.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it.each(PERSONAS)('reconciles account balances with opening balance plus flows for %s', (persona) => {
    const state = stateFor(persona)
    for (const { account, balance } of accountBalances(state)) {
      const flows = state.transactions.filter((t) => t.accountId === account.id).reduce((s, t) => s + t.amount, 0)
      expect(balance).toBeCloseTo(account.openingBalance + flows, 2)
    }
  })

  it.each(PERSONAS)('never leaves an account below zero at the end of a day for %s', (persona) => {
    const state = stateFor(persona)
    for (const account of state.accounts) {
      const series = balanceSeries(
        { accounts: [account], transactions: state.transactions.filter((t) => t.accountId === account.id) },
        { start: account.openingDate, end: TODAY },
      )
      expect(Math.min(...series.map((p) => p.balance))).toBeGreaterThanOrEqual(0)
    }
  })

  it.each(PERSONAS)('balances internal transfers to zero for %s', (persona) => {
    const state = stateFor(persona)
    const net = state.transactions.filter((t) => t.categoryId === 'transfer' && !/venmo|zelle/i.test(t.description)).reduce((s, t) => s + t.amount, 0)
    expect(net).toBeCloseTo(0, 2)
  })

  it.each(PERSONAS)('links every paid invoice to exactly one matching income transaction for %s', (persona) => {
    const state = stateFor(persona)
    for (const inv of state.invoices) {
      const linked = state.transactions.filter((t) => t.invoiceId === inv.id)
      if (inv.status === 'paid') {
        expect(linked).toHaveLength(1)
        expect(linked[0].amount).toBeCloseTo(invoiceTotal(inv), 2)
        expect(linked[0].date).toBe(inv.paidDate)
        expect(inv.transactionId).toBe(linked[0].id)
      } else {
        expect(linked).toHaveLength(0)
      }
    }
    expect(new Set(state.invoices.map((i) => i.number)).size).toBe(state.invoices.length)
    expect(state.invoices.filter((i) => i.status === 'draft')).toHaveLength(1)
  })

  it('records quarterly tax payments as transactions', () => {
    for (const persona of ['freelancer', 'business'] as const) {
      const payments = stateFor(persona).transactions.filter((t) => t.categoryId === 'tax-payment')
      expect(payments.length).toBeGreaterThanOrEqual(2)
      for (const p of payments) expect(p.amount).toBeLessThan(0)
    }
  })

  it.each(PERSONAS)('leaves a small review queue for %s', (persona) => {
    const queue = stateFor(persona).transactions.filter(needsReview)
    expect(queue.length).toBeGreaterThan(0)
    expect(queue.length).toBeLessThanOrEqual(40)
  })

  it.each(PERSONAS)('tells the persona story through the insights engine for %s', (persona) => {
    for (const today of [TODAY, '2026-03-20', '2027-01-05', '2026-07-31']) {
      const top = weakPoints(stateFor(persona, today), today)
        .slice(0, 2)
        .map((w) => w.id)
      expect(top.sort()).toEqual([...getPersona(persona).expectedWeakPoints].sort())
    }
  })
})
