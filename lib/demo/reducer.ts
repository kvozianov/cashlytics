import { getCategory } from './categories'
import { categorize, normaliseMerchant, ruleMatches } from './categorize'
import { addDays } from './dates'
import { invoiceTotal, nextInvoiceNumber } from './invoices'
import { getPersona } from './personas'
import { taxPaymentDescription, type Quarter } from './tax-dates'
import type {
  Budget,
  CategoryId,
  CategoryRule,
  Client,
  DemoState,
  Goal,
  Invoice,
  InvoiceLine,
  ISODate,
  Period,
  TaxSettings,
  Transaction,
} from './types'

export interface NewTransaction {
  date: ISODate
  description: string
  /** Signed: negative = money out. */
  amount: number
  accountId?: string
  /** Set to skip the categoriser (counts as a person's choice). */
  categoryId?: CategoryId
  note?: string
  source?: Transaction['source']
}

export interface NewInvoice {
  clientId: string
  issueDate: ISODate
  /** Defaults to issue date + the client's payment terms. */
  dueDate?: ISODate
  lines: (Omit<InvoiceLine, 'id'> & { id?: string })[]
  notes?: string
  /** Optional tax on top of the lines, 0..1. */
  taxRate?: number
  /** Defaults to `draft`. */
  status?: 'draft' | 'sent'
}

export type DemoAction =
  | { type: 'replace'; state: DemoState }
  | { type: 'addTransaction'; tx: NewTransaction }
  | { type: 'updateTransaction'; id: string; patch: Partial<Pick<Transaction, 'date' | 'description' | 'amount' | 'accountId' | 'note' | 'categoryId'>> }
  | { type: 'deleteTransaction'; id: string }
  | { type: 'recategorise'; id: string; categoryId: CategoryId; createRule?: boolean }
  | { type: 'recategoriseMany'; ids: string[]; categoryId: CategoryId }
  | { type: 'deleteTransactions'; ids: string[] }
  | { type: 'confirmCategory'; id: string }
  | { type: 'addRule'; rule: Omit<CategoryRule, 'id'>; applyToExisting?: boolean }
  | { type: 'removeRule'; id: string }
  | { type: 'importTransactions'; rows: { date: ISODate; description: string; amount: number }[]; accountId?: string }
  | { type: 'addClient'; client: Omit<Client, 'id'> }
  | { type: 'addInvoice'; invoice: NewInvoice }
  | { type: 'updateInvoice'; id: string; patch: Partial<Pick<Invoice, 'clientId' | 'issueDate' | 'dueDate' | 'lines' | 'notes' | 'taxRate'>> }
  | { type: 'deleteInvoice'; id: string }
  | { type: 'markInvoiceSent'; id: string; date: ISODate }
  | { type: 'markInvoicePaid'; id: string; date: ISODate; accountId?: string }
  | { type: 'transfer'; from: string; to: string; amount: number; date: ISODate; note?: string }
  | { type: 'openTaxReserve' }
  | { type: 'setBudget'; categoryId: CategoryId; monthlyLimit: number | null }
  | { type: 'addGoal'; goal: Omit<Goal, 'id'> }
  | { type: 'updateGoal'; id: string; patch: Partial<Omit<Goal, 'id'>> }
  | { type: 'deleteGoal'; id: string }
  | { type: 'contributeToGoal'; id: string; amount: number; date: ISODate }
  | { type: 'updateTaxSettings'; patch: Partial<TaxSettings> }
  | { type: 'recordTaxPayment'; year: number; quarter: Quarter; amount: number; date: ISODate; accountId?: string }
  | { type: 'setPeriod'; period: Period }
  | { type: 'completeLesson'; id: string }

const round2 = (n: number) => Math.round(n * 100) / 100

/** Keeps transactions newest first; new items go before older ones on the same day. */
export function insertTransaction(list: readonly Transaction[], tx: Transaction): Transaction[] {
  const idx = list.findIndex((t) => t.date <= tx.date)
  if (idx === -1) return [...list, tx]
  return [...list.slice(0, idx), tx, ...list.slice(idx)]
}

function sortTransactions(list: Transaction[]): Transaction[] {
  return list
    .map((t, i) => ({ t, i }))
    .sort((a, b) => (a.t.date === b.t.date ? a.i - b.i : b.t.date.localeCompare(a.t.date)))
    .map((x) => x.t)
}

export function everydayAccountId(state: Pick<DemoState, 'accounts'>): string {
  return (state.accounts.find((a) => a.purpose === 'everyday') ?? state.accounts[0]).id
}

function nextId(state: DemoState, prefix: string): [string, DemoState] {
  return [`${prefix}-u${state.seq}`, { ...state, seq: state.seq + 1 }]
}

function buildTransaction(state: DemoState, id: string, input: NewTransaction): Transaction {
  const merchant = normaliseMerchant(input.description)
  const base = {
    id,
    date: input.date,
    description: input.description.trim(),
    merchant,
    amount: round2(input.amount),
    accountId: input.accountId ?? everydayAccountId(state),
    source: input.source ?? 'manual',
    note: input.note,
  }
  if (input.categoryId) {
    return { ...base, categoryId: input.categoryId, confidence: 1, reason: 'Chosen by you', reviewed: true }
  }
  const r = categorize(input.description, input.amount, state.rules)
  return { ...base, categoryId: r.categoryId, confidence: r.confidence, reason: r.reason, reviewed: false }
}

/** Re-runs the categoriser on everything a person has not confirmed by hand. */
function recategoriseUnreviewed(transactions: readonly Transaction[], rules: readonly CategoryRule[]): Transaction[] {
  return transactions.map((t) => {
    if (t.reviewed) return t
    const r = categorize(t.description, t.amount, rules)
    if (r.categoryId === t.categoryId && r.reason === t.reason) return t
    return { ...t, categoryId: r.categoryId, confidence: r.confidence, reason: r.reason }
  })
}

/** Applies one rule to matching transactions that a person has not set by hand. Returns ids changed. */
export function applyRule(transactions: readonly Transaction[], rule: CategoryRule): { transactions: Transaction[]; changed: string[] } {
  const changed: string[] = []
  const label = getCategory(rule.categoryId).label
  const next = transactions.map((t) => {
    if (t.reviewed || !ruleMatches(rule, t.description, t.amount, t.merchant)) return t
    if (t.categoryId === rule.categoryId && t.confidence >= 0.95) return t
    changed.push(t.id)
    return { ...t, categoryId: rule.categoryId, confidence: rule.match === 'exact' ? 0.98 : 0.95, reason: `Your rule "${rule.pattern}" → ${label}` }
  })
  return { transactions: next, changed }
}

function incomeCategoryFor(state: DemoState): CategoryId {
  return getPersona(state.personaId).kind === 'business' ? 'sales' : 'client-income'
}

function reduce(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'replace':
      return action.state

    case 'addTransaction': {
      const [id, s] = nextId(state, 'tx')
      return { ...s, transactions: insertTransaction(s.transactions, buildTransaction(s, id, action.tx)) }
    }

    case 'updateTransaction': {
      const transactions = state.transactions.map((t) => {
        if (t.id !== action.id) return t
        const next: Transaction = { ...t, ...action.patch }
        if (action.patch.amount !== undefined) next.amount = round2(action.patch.amount)
        if (action.patch.description !== undefined) next.merchant = normaliseMerchant(action.patch.description)
        if (action.patch.categoryId) {
          return { ...next, confidence: 1, reason: 'Chosen by you', reviewed: true }
        }
        if (!t.reviewed && (action.patch.description !== undefined || action.patch.amount !== undefined)) {
          const r = categorize(next.description, next.amount, state.rules)
          return { ...next, categoryId: r.categoryId, confidence: r.confidence, reason: r.reason }
        }
        return next
      })
      return { ...state, transactions: action.patch.date ? sortTransactions(transactions) : transactions }
    }

    case 'deleteTransaction': {
      const tx = state.transactions.find((t) => t.id === action.id)
      if (!tx) return state
      const invoices = tx.invoiceId
        ? state.invoices.map((inv) =>
            inv.id === tx.invoiceId ? { ...inv, status: 'sent' as const, paidDate: undefined, transactionId: undefined } : inv,
          )
        : state.invoices
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id), invoices }
    }

    case 'recategorise': {
      const tx = state.transactions.find((t) => t.id === action.id)
      if (!tx) return state
      let transactions = state.transactions.map((t) =>
        t.id === action.id ? { ...t, categoryId: action.categoryId, confidence: 1, reason: 'Chosen by you', reviewed: true } : t,
      )
      let rules = state.rules
      let s = state
      if (action.createRule) {
        const pattern = tx.merchant
        const existing = rules.find((r) => r.match === 'exact' && r.pattern.toLowerCase() === pattern.toLowerCase())
        let rule: CategoryRule
        if (existing) {
          rule = { ...existing, categoryId: action.categoryId }
          rules = rules.map((r) => (r.id === existing.id ? rule : r))
        } else {
          let id: string
          ;[id, s] = nextId(state, 'rule')
          rule = { id, match: 'exact', pattern, categoryId: action.categoryId }
          rules = [rule, ...rules]
        }
        transactions = applyRule(transactions, rule).transactions
      }
      return { ...s, transactions, rules }
    }

    case 'recategoriseMany': {
      const ids = new Set(action.ids)
      let changed = false
      const transactions = state.transactions.map((t) => {
        if (!ids.has(t.id)) return t
        if (t.reviewed && t.categoryId === action.categoryId) return t
        changed = true
        return { ...t, categoryId: action.categoryId, confidence: 1, reason: 'Chosen by you', reviewed: true }
      })
      return changed ? { ...state, transactions } : state
    }

    case 'deleteTransactions': {
      const ids = new Set(action.ids)
      const removed = state.transactions.filter((t) => ids.has(t.id))
      if (removed.length === 0) return state
      const reopen = new Set(removed.flatMap((t) => (t.invoiceId ? [t.invoiceId] : [])))
      return {
        ...state,
        transactions: state.transactions.filter((t) => !ids.has(t.id)),
        invoices: reopen.size
          ? state.invoices.map((inv) => (reopen.has(inv.id) ? { ...inv, status: 'sent' as const, paidDate: undefined, transactionId: undefined } : inv))
          : state.invoices,
      }
    }

    case 'confirmCategory':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? { ...t, reviewed: true, confidence: Math.max(t.confidence, 0.99) } : t)),
      }

    case 'addRule': {
      const [id, s] = nextId(state, 'rule')
      const rule: CategoryRule = { ...action.rule, pattern: action.rule.pattern.trim(), id }
      const transactions = action.applyToExisting === false ? s.transactions : applyRule(s.transactions, rule).transactions
      return { ...s, rules: [rule, ...s.rules], transactions }
    }

    case 'removeRule': {
      const rules = state.rules.filter((r) => r.id !== action.id)
      return { ...state, rules, transactions: recategoriseUnreviewed(state.transactions, rules) }
    }

    case 'importTransactions': {
      const seen = new Set(state.transactions.map((t) => `${t.date}|${t.amount.toFixed(2)}|${t.description.toLowerCase()}`))
      let s = state
      let transactions = state.transactions
      for (const row of action.rows) {
        const key = `${row.date}|${round2(row.amount).toFixed(2)}|${row.description.trim().toLowerCase()}`
        if (seen.has(key)) continue
        seen.add(key)
        let id: string
        ;[id, s] = nextId(s, 'tx')
        transactions = insertTransaction(transactions, buildTransaction(s, id, { ...row, accountId: action.accountId, source: 'import' }))
      }
      return { ...s, transactions }
    }

    case 'addClient': {
      const [id, s] = nextId(state, 'client')
      return { ...s, clients: [...s.clients, { ...action.client, id }] }
    }

    case 'addInvoice': {
      const [id, s] = nextId(state, 'inv')
      const client = s.clients.find((c) => c.id === action.invoice.clientId)
      const status = action.invoice.status ?? 'draft'
      const invoice: Invoice = {
        id,
        number: nextInvoiceNumber(s.invoices),
        clientId: action.invoice.clientId,
        issueDate: action.invoice.issueDate,
        dueDate: action.invoice.dueDate ?? addDays(action.invoice.issueDate, client?.termsDays ?? 14),
        lines: action.invoice.lines.map((l, i) => ({ ...l, id: l.id ?? `line-${i + 1}` })),
        notes: action.invoice.notes,
        ...(action.invoice.taxRate ? { taxRate: action.invoice.taxRate } : {}),
        status,
        sentDate: status === 'sent' ? action.invoice.issueDate : undefined,
      }
      return { ...s, invoices: [invoice, ...s.invoices] }
    }

    case 'updateInvoice':
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          inv.id === action.id && inv.status !== 'paid'
            ? { ...inv, ...action.patch, lines: (action.patch.lines ?? inv.lines).map((l, i) => ({ ...l, id: l.id || `line-${i + 1}` })) }
            : inv,
        ),
      }

    case 'deleteInvoice': {
      const inv = state.invoices.find((i) => i.id === action.id)
      if (!inv || inv.status === 'paid') return state
      return { ...state, invoices: state.invoices.filter((i) => i.id !== action.id) }
    }

    case 'markInvoiceSent':
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          inv.id === action.id && inv.status === 'draft' ? { ...inv, status: 'sent', sentDate: action.date } : inv,
        ),
      }

    case 'markInvoicePaid': {
      const inv = state.invoices.find((i) => i.id === action.id)
      if (!inv || inv.status === 'paid' || inv.transactionId) return state
      const client = state.clients.find((c) => c.id === inv.clientId)
      const [id, s] = nextId(state, 'tx')
      const categoryId = incomeCategoryFor(s)
      const tx: Transaction = {
        id,
        date: action.date,
        description: `INVOICE ${inv.number} PAYMENT ${(client?.name ?? 'CLIENT').toUpperCase()}`,
        merchant: client?.name ?? 'Client payment',
        amount: invoiceTotal(inv),
        accountId: action.accountId && s.accounts.some((a) => a.id === action.accountId) ? action.accountId : everydayAccountId(s),
        categoryId,
        confidence: 1,
        reason: `Linked to invoice ${inv.number}`,
        source: 'invoice',
        reviewed: true,
        invoiceId: inv.id,
      }
      return {
        ...s,
        transactions: insertTransaction(s.transactions, tx),
        invoices: s.invoices.map((i) =>
          i.id === inv.id ? { ...i, status: 'paid', paidDate: action.date, sentDate: i.sentDate ?? i.issueDate, transactionId: id } : i,
        ),
      }
    }

    case 'transfer': {
      const from = state.accounts.find((a) => a.id === action.from)
      const to = state.accounts.find((a) => a.id === action.to)
      const amount = round2(action.amount)
      if (!from || !to || from.id === to.id || amount <= 0) return state
      const [outId, s1] = nextId(state, 'tx')
      const [inId, s] = nextId(s1, 'tx')
      const out = buildTransaction(s, outId, {
        date: action.date,
        description: `ONLINE TRANSFER TO ${to.name.toUpperCase()} XXXX${to.last4}`,
        amount: -amount,
        accountId: from.id,
        categoryId: 'transfer',
        note: action.note,
      })
      const inn = buildTransaction(s, inId, {
        date: action.date,
        description: `ONLINE TRANSFER FROM ${from.name.toUpperCase()} XXXX${from.last4}`,
        amount,
        accountId: to.id,
        categoryId: 'transfer',
        note: action.note,
      })
      return { ...s, transactions: insertTransaction(insertTransaction(s.transactions, out), inn) }
    }

    case 'openTaxReserve': {
      if (state.accounts.some((a) => a.purpose === 'tax')) return state
      const everyday = state.accounts.find((a) => a.id === everydayAccountId(state))!
      const [id, s] = nextId(state, 'acct')
      const last4 = String((Number(everyday.last4) + 7) % 10000).padStart(4, '0')
      const account = { id, name: 'Tax reserve', type: 'savings' as const, purpose: 'tax' as const, institution: everyday.institution, last4, openingBalance: 0, openingDate: everyday.openingDate }
      return { ...s, accounts: [...s.accounts, account] }
    }

    case 'setBudget': {
      const others = state.budgets.filter((b) => b.categoryId !== action.categoryId)
      if (action.monthlyLimit === null || action.monthlyLimit <= 0) return { ...state, budgets: others }
      const existing = state.budgets.find((b) => b.categoryId === action.categoryId)
      const budget: Budget = { categoryId: action.categoryId, monthlyLimit: round2(action.monthlyLimit) }
      return { ...state, budgets: existing ? state.budgets.map((b) => (b.categoryId === action.categoryId ? budget : b)) : [...state.budgets, budget] }
    }

    case 'addGoal': {
      const [id, s] = nextId(state, 'goal')
      return { ...s, goals: [...s.goals, { ...action.goal, id }] }
    }

    case 'updateGoal':
      return { ...state, goals: state.goals.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)) }

    case 'deleteGoal':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) }

    case 'contributeToGoal': {
      const goal = state.goals.find((g) => g.id === action.id)
      if (!goal || action.amount === 0) return state
      const amount = round2(goal.saved + action.amount < 0 ? -goal.saved : action.amount)
      let s: DemoState = { ...state, goals: state.goals.map((g) => (g.id === goal.id ? { ...g, saved: round2(g.saved + amount) } : g)) }
      const from = everydayAccountId(s)
      const target = goal.accountId ? s.accounts.find((a) => a.id === goal.accountId) : undefined
      if (target && target.id !== from) {
        const source = s.accounts.find((a) => a.id === from)!
        const [outId, s1] = nextId(s, 'tx')
        const [inId, s2] = nextId(s1, 'tx')
        s = s2
        const out = buildTransaction(s, outId, {
          date: action.date,
          description: `ONLINE TRANSFER TO ${target.name.toUpperCase()} XXXX${target.last4}`,
          amount: -amount,
          accountId: from,
          categoryId: 'transfer',
          note: `Goal: ${goal.name}`,
        })
        const inn = buildTransaction(s, inId, {
          date: action.date,
          description: `ONLINE TRANSFER FROM ${source.name.toUpperCase()} XXXX${source.last4}`,
          amount,
          accountId: target.id,
          categoryId: 'transfer',
          note: `Goal: ${goal.name}`,
        })
        s = { ...s, transactions: insertTransaction(insertTransaction(s.transactions, out), inn) }
      }
      return s
    }

    case 'updateTaxSettings':
      return { ...state, taxSettings: { ...state.taxSettings, ...action.patch } }

    case 'recordTaxPayment': {
      if (action.amount <= 0) return state
      const [id, s] = nextId(state, 'tx')
      const accountId = action.accountId ?? (s.accounts.find((a) => a.purpose === 'tax') ?? s.accounts.find((a) => a.purpose === 'everyday') ?? s.accounts[0]).id
      const tx = buildTransaction(s, id, {
        date: action.date,
        description: taxPaymentDescription(action.year, action.quarter),
        amount: -action.amount,
        accountId,
        categoryId: 'tax-payment',
      })
      return { ...s, transactions: insertTransaction(s.transactions, tx) }
    }

    case 'setPeriod':
      return { ...state, period: action.period }

    case 'completeLesson':
      return state.completedLessons.includes(action.id) ? state : { ...state, completedLessons: [...state.completedLessons, action.id] }
  }
}

/** Pure state transition for the demo. Every change except the period marks the state as edited. */
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  const next = reduce(state, action)
  if (next === state || action.type === 'replace' || action.type === 'setPeriod') return next
  return next.edited ? next : { ...next, edited: true }
}

