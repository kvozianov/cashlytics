import { addDays, diffDays } from './dates'
import type { Client, DemoState, Invoice, InvoiceStatus, ISODate } from './types'

const round2 = (n: number) => Math.round(n * 100) / 100

export function lineTotal(line: { quantity: number; unitPrice: number }): number {
  return round2(line.quantity * line.unitPrice)
}

/** Sum of the line items, before any invoice tax. */
type Priced = { lines: readonly { quantity: number; unitPrice: number }[]; taxRate?: number }

export function invoiceSubtotal(invoice: Pick<Priced, 'lines'>): number {
  return round2(invoice.lines.reduce((s, l) => s + lineTotal(l), 0))
}

/** Tax added on top of the line items (0 when the invoice has no tax rate). */
export function invoiceTaxAmount(invoice: Priced): number {
  return invoice.taxRate ? round2(invoiceSubtotal(invoice) * invoice.taxRate) : 0
}

export function invoiceTotal(invoice: Priced): number {
  return round2(invoiceSubtotal(invoice) + invoiceTaxAmount(invoice))
}

/** Stored status plus `overdue` for sent invoices past their due date. */
export function invoiceStatus(invoice: Pick<Invoice, 'status' | 'dueDate'>, today: ISODate): InvoiceStatus {
  if (invoice.status === 'sent' && invoice.dueDate < today) return 'overdue'
  return invoice.status
}

/** Days past the due date (0 if not overdue). */
export function daysOverdue(invoice: Pick<Invoice, 'status' | 'dueDate'>, today: ISODate): number {
  return invoiceStatus(invoice, today) === 'overdue' ? diffDays(today, invoice.dueDate) : 0
}

/** Days between due date and payment for paid invoices; negative = early. */
export function daysLate(invoice: Pick<Invoice, 'dueDate' | 'paidDate'>): number | null {
  return invoice.paidDate ? diffDays(invoice.paidDate, invoice.dueDate) : null
}

export interface AgeingBucket {
  id: 'current' | '1-30' | '31-60' | '61-90' | '90+'
  label: string
  amount: number
  count: number
}

/** Unpaid sent invoices grouped by how long they are overdue. */
export function ageingBuckets(invoices: readonly Invoice[], today: ISODate): AgeingBucket[] {
  const buckets: AgeingBucket[] = [
    { id: 'current', label: 'Not yet due', amount: 0, count: 0 },
    { id: '1-30', label: '1–30 days', amount: 0, count: 0 },
    { id: '31-60', label: '31–60 days', amount: 0, count: 0 },
    { id: '61-90', label: '61–90 days', amount: 0, count: 0 },
    { id: '90+', label: '90+ days', amount: 0, count: 0 },
  ]
  for (const inv of invoices) {
    if (inv.status !== 'sent') continue
    const late = daysOverdue(inv, today)
    const idx = late === 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : late <= 90 ? 3 : 4
    buckets[idx].amount = round2(buckets[idx].amount + invoiceTotal(inv))
    buckets[idx].count++
  }
  return buckets
}

export interface ReceivablesSummary {
  /** Sent and not yet paid. */
  outstanding: number
  outstandingCount: number
  overdue: number
  overdueCount: number
  drafts: number
  draftCount: number
  /** Paid in the last 30 days. */
  paidLast30: number
}

export function receivablesSummary(invoices: readonly Invoice[], today: ISODate): ReceivablesSummary {
  const s: ReceivablesSummary = { outstanding: 0, outstandingCount: 0, overdue: 0, overdueCount: 0, drafts: 0, draftCount: 0, paidLast30: 0 }
  const since = addDays(today, -30)
  for (const inv of invoices) {
    const total = invoiceTotal(inv)
    const status = invoiceStatus(inv, today)
    if (status === 'sent' || status === 'overdue') {
      s.outstanding += total
      s.outstandingCount++
    }
    if (status === 'overdue') {
      s.overdue += total
      s.overdueCount++
    }
    if (status === 'draft') {
      s.drafts += total
      s.draftCount++
    }
    if (status === 'paid' && inv.paidDate && inv.paidDate >= since) s.paidLast30 += total
  }
  s.outstanding = round2(s.outstanding)
  s.overdue = round2(s.overdue)
  s.drafts = round2(s.drafts)
  s.paidLast30 = round2(s.paidLast30)
  return s
}

export interface ClientStats {
  client: Client
  invoiced: number
  paidCount: number
  /** Average days from due date to payment over paid invoices (null without history). */
  avgDaysLate: number | null
  outstanding: number
  overdue: number
  /** Longest current overdue, days. */
  maxDaysOverdue: number
}

export function clientStats(state: Pick<DemoState, 'clients' | 'invoices'>, today: ISODate): ClientStats[] {
  return state.clients.map((client) => {
    const mine = state.invoices.filter((i) => i.clientId === client.id && i.status !== 'draft')
    const paid = mine.filter((i) => i.status === 'paid' && i.paidDate)
    const lateDays = paid.map((i) => daysLate(i) ?? 0)
    let outstanding = 0
    let overdue = 0
    let maxDaysOverdue = 0
    for (const inv of mine) {
      if (inv.status !== 'sent') continue
      outstanding += invoiceTotal(inv)
      const late = daysOverdue(inv, today)
      if (late > 0) {
        overdue += invoiceTotal(inv)
        maxDaysOverdue = Math.max(maxDaysOverdue, late)
      }
    }
    return {
      client,
      invoiced: round2(mine.reduce((s, i) => s + invoiceTotal(i), 0)),
      paidCount: paid.length,
      avgDaysLate: lateDays.length ? Math.round(lateDays.reduce((s, d) => s + d, 0) / lateDays.length) : null,
      outstanding: round2(outstanding),
      overdue: round2(overdue),
      maxDaysOverdue,
    }
  })
}

/** Next number in the `INV-042` sequence. */
export function nextInvoiceNumber(invoices: readonly Pick<Invoice, 'number'>[]): string {
  const max = invoices.reduce((m, inv) => {
    const n = Number(/(\d+)\s*$/.exec(inv.number)?.[1] ?? 0)
    return Math.max(m, n)
  }, 0)
  return `INV-${String(max + 1).padStart(3, '0')}`
}

export function dueDateFor(issueDate: ISODate, termsDays: number): ISODate {
  return addDays(issueDate, termsDays)
}
