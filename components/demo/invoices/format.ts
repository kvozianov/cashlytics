import { diffDays } from '@/lib/demo/dates'
import type { InvoiceStatus, ISODate, Persona } from '@/lib/demo/types'

export const TERMS_OPTIONS = [
  { days: 0, label: 'Due on receipt' },
  { days: 7, label: 'Net 7' },
  { days: 14, label: 'Net 14' },
  { days: 30, label: 'Net 30' },
] as const

export function termsLabel(issueDate: ISODate, dueDate: ISODate): string {
  const days = diffDays(dueDate, issueDate)
  return days <= 0 ? 'Due on receipt' : `Net ${days}`
}

/** Fictional letterhead for the persona; `.example` addresses never resolve. */
export function letterhead(p: Pick<Persona, 'id' | 'name' | 'role'>) {
  const slug = p.name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
  return { name: p.name, role: p.role, email: `billing@${slug}.example` }
}

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  overdue: 'Overdue',
  paid: 'Paid',
}

export type StatusFilter = 'all' | InvoiceStatus

export const STATUS_FILTERS: StatusFilter[] = ['all', 'draft', 'sent', 'overdue', 'paid']

export function isStatusFilter(x: string | null): x is StatusFilter {
  return x !== null && (STATUS_FILTERS as string[]).includes(x)
}
