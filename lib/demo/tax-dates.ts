import { makeISODate } from './dates'
import type { ISODate } from './types'

export type Quarter = 1 | 2 | 3 | 4

/**
 * Illustrative quarterly schedule: each quarter's estimated payment is due on the 15th
 * of the month after it ends (Q4 falls in January of the next year).
 */
export function quarterDueDate(year: number, quarter: Quarter): ISODate {
  return quarter === 4 ? makeISODate(year + 1, 1, 15) : makeISODate(year, quarter * 3 + 1, 15)
}

export function quarterStart(year: number, quarter: Quarter): ISODate {
  return makeISODate(year, (quarter - 1) * 3 + 1, 1)
}

export function quarterEnd(year: number, quarter: Quarter): ISODate {
  return makeISODate(year, quarter * 3 + 1, 0)
}

/** Reads `2026 Q1` style tags from a payment description. */
export function parseTaxTag(description: string): { year: number; quarter: Quarter } | null {
  const m = /\b(20\d{2})\s*Q([1-4])\b/i.exec(description) ?? /\bQ([1-4])\s*(20\d{2})\b/i.exec(description)
  if (!m) return null
  const [year, quarter] = m[1].length === 4 ? [Number(m[1]), Number(m[2])] : [Number(m[2]), Number(m[1])]
  return { year, quarter: quarter as Quarter }
}

export function taxPaymentDescription(year: number, quarter: Quarter): string {
  return `EST TAX PMT ${year} Q${quarter} TAX OFFICE`
}
