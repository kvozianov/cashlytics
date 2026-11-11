import { getCategory } from './categories'
import { invoiceStatus, invoiceTotal } from './invoices'
import { LESSONS, type Lesson } from './lessons'
import type { DemoState, Invoice, InvoiceStatus, ISODate, Transaction } from './types'

/** Searches start at two characters, so one stray key does not list half the ledger. */
export const MIN_SEARCH_LENGTH = 2

export function normaliseQuery(query: string): string[] {
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean)
}

/** Every word of the query appears somewhere in the text (case-insensitive). */
export function matchesQuery(text: string, words: string[]): boolean {
  const hay = text.toLowerCase()
  return words.every((w) => hay.includes(w))
}

/** `add coffee 4.50` → `coffee 4.50`; anything else → null. */
export function parseAddCommand(query: string): string | null {
  const m = /^\s*add\s+(.+)$/i.exec(query)
  return m ? m[1].trim() || null : null
}

function searchable(query: string): string[] | null {
  return query.trim().length >= MIN_SEARCH_LENGTH ? normaliseQuery(query) : null
}

/** Newest first: merchant, raw bank text, category, amount and date all count. */
export function searchTransactions(state: Pick<DemoState, 'transactions'>, query: string, limit = 5): Transaction[] {
  const words = searchable(query)
  if (!words) return []
  const out: Transaction[] = []
  for (const t of state.transactions) {
    const text = `${t.merchant} ${t.description} ${getCategory(t.categoryId).label} ${Math.abs(t.amount).toFixed(2)} ${t.date} ${t.note ?? ''}`
    if (matchesQuery(text, words)) out.push(t)
    if (out.length >= limit) break
  }
  return out
}

export interface InvoiceHit {
  invoice: Invoice
  clientName: string
  status: InvoiceStatus
  total: number
}

/** By number, client or status; newest first. */
export function searchInvoices(state: Pick<DemoState, 'invoices' | 'clients'>, query: string, today: ISODate, limit = 5): InvoiceHit[] {
  const words = searchable(query)
  if (!words) return []
  const clients = new Map(state.clients.map((c) => [c.id, c.name]))
  return [...state.invoices]
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number))
    .map((invoice) => ({ invoice, clientName: clients.get(invoice.clientId) ?? '', status: invoiceStatus(invoice, today), total: invoiceTotal(invoice) }))
    .filter((h) => matchesQuery(`${h.invoice.number} ${h.clientName} ${h.status} invoice`, words))
    .slice(0, limit)
}

/** By title first, then summary. */
export function searchLessons(query: string, limit = 5): Lesson[] {
  const words = searchable(query)
  if (!words) return []
  const byTitle = LESSONS.filter((l) => matchesQuery(l.title, words))
  const bySummary = LESSONS.filter((l) => !byTitle.includes(l) && matchesQuery(l.summary, words))
  return [...byTitle, ...bySummary].slice(0, limit)
}
