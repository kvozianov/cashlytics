import { isValidISODate, makeISODate } from './dates'
import type { ISODate, Transaction } from './types'
import { getCategory } from './categories'

export interface ParsedRow {
  /** 1-based line number in the file. */
  line: number
  date: ISODate
  description: string
  amount: number
}

export interface ParseError {
  line: number
  message: string
}

export interface ParseResult {
  rows: ParsedRow[]
  errors: ParseError[]
  delimiter: ',' | ';' | '\t'
  /** Detected column roles. */
  columns: { date: number; description: number; amount?: number; debit?: number; credit?: number }
}

/** Splits one CSV line, honouring double quotes and doubled quotes inside them. */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === delimiter) {
      out.push(field)
      field = ''
    } else field += ch
  }
  out.push(field)
  return out.map((f) => f.trim())
}

function splitLines(text: string): string[] {
  // Keep newlines inside quoted fields.
  const lines: string[] = []
  let current = ''
  let quoted = false
  for (const ch of text.replace(/^﻿/, '')) {
    if (ch === '"') quoted = !quoted
    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\n' || current) lines.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current) lines.push(current)
  return lines.map((l) => l.replace(/\r$/, ''))
}

function detectDelimiter(lines: string[]): ',' | ';' | '\t' {
  const sample = lines.slice(0, 5).join('\n')
  const counts = { ',': 0, ';': 0, '\t': 0 } as Record<',' | ';' | '\t', number>
  let quoted = false
  for (const ch of sample) {
    if (ch === '"') quoted = !quoted
    else if (!quoted && ch in counts) counts[ch as ',' | ';' | '\t']++
  }
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as ',' | ';' | '\t') ?? ','
}

/**
 * Parses an amount like `1,234.50`, `-12.00`, `(45.00)`, `$1 234,50`, `1.234,50`.
 * Returns null when it is not a number.
 */
export function parseAmount(raw: string): number | null {
  let s = raw.trim().replace(/[$€£\s ]/g, '').replace(/^\+/, '')
  if (!s) return null
  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1)
  }
  if (s.startsWith('-') || s.startsWith('−')) {
    negative = !negative
    s = s.slice(1)
  }
  if (s.endsWith('-')) {
    negative = !negative
    s = s.slice(0, -1)
  }
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > lastDot) {
    // Comma is the decimal separator if followed by 1–2 digits, otherwise a thousands separator.
    s = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else {
    s = s.replace(/,/g, '')
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return negative ? -n : n
}

/** Accepts `2026-03-14`, `14/03/2026`, `03/14/2026`, `14.03.2026`, `2026/03/14`. */
export function parseDate(raw: string): ISODate | null {
  const s = raw.trim()
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s)
  if (m) return valid(Number(m[1]), Number(m[2]), Number(m[3]))
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(s)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])
    // Dots are day-first in most of the world; slashes are month-first (US) unless that is impossible.
    const dayFirst = s.includes('.') || a > 12
    return dayFirst ? valid(year, b, a) : valid(year, a, b)
  }
  return null
}

function valid(year: number, month: number, day: number): ISODate | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const iso = makeISODate(year, month, day)
  return isValidISODate(iso) && iso === `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` ? iso : null
}

const HEADER_HINTS = {
  date: /^(date|transaction date|posted|posting date|booking date|value date)$/i,
  description: /^(description|details|memo|payee|merchant|narrative|name|transaction)$/i,
  amount: /^(amount|value|sum|amount \(usd\))$/i,
  debit: /^(debit|withdrawal|withdrawals|money out|paid out|out)$/i,
  credit: /^(credit|deposit|deposits|money in|paid in|in)$/i,
}

/**
 * Reads a bank statement export. Tolerates `,` `;` or tab separators, quoted fields,
 * a single signed amount column or separate debit/credit columns, and reports bad rows
 * instead of failing the whole file.
 */
export function parseStatementCsv(text: string): ParseResult {
  const lines = splitLines(text).filter((l) => l.trim() !== '')
  const delimiter = detectDelimiter(lines)
  const errors: ParseError[] = []
  const rows: ParsedRow[] = []
  if (lines.length === 0) {
    return { rows, errors: [{ line: 1, message: 'The file is empty.' }], delimiter, columns: { date: 0, description: 1, amount: 2 } }
  }

  const header = splitCsvLine(lines[0], delimiter)
  const find = (re: RegExp) => header.findIndex((h) => re.test(h))
  let columns: ParseResult['columns']
  let startAt = 1
  const date = find(HEADER_HINTS.date)
  const description = find(HEADER_HINTS.description)
  if (date >= 0 && description >= 0) {
    const amount = find(HEADER_HINTS.amount)
    const debit = find(HEADER_HINTS.debit)
    const credit = find(HEADER_HINTS.credit)
    if (amount < 0 && (debit < 0 || credit < 0)) {
      return { rows, errors: [{ line: 1, message: 'No amount column found (expected "Amount" or "Debit" and "Credit").' }], delimiter, columns: { date, description } }
    }
    columns = amount >= 0 ? { date, description, amount } : { date, description, debit, credit }
  } else {
    // No header: assume date, description, amount.
    columns = { date: 0, description: 1, amount: 2 }
    startAt = 0
  }

  lines.slice(startAt).forEach((raw, i) => {
    const line = i + startAt + 1
    const cells = splitCsvLine(raw, delimiter)
    const d = parseDate(cells[columns.date] ?? '')
    if (!d) {
      errors.push({ line, message: `Unreadable date "${cells[columns.date] ?? ''}".` })
      return
    }
    const desc = (cells[columns.description] ?? '').replace(/\s+/g, ' ').trim()
    if (!desc) {
      errors.push({ line, message: 'Missing description.' })
      return
    }
    let amount: number | null
    if (columns.amount !== undefined) {
      amount = parseAmount(cells[columns.amount] ?? '')
    } else {
      const debit = parseAmount(cells[columns.debit!] ?? '')
      const credit = parseAmount(cells[columns.credit!] ?? '')
      amount = debit === null && credit === null ? null : (credit ?? 0) - Math.abs(debit ?? 0)
    }
    if (amount === null || amount === 0) {
      errors.push({ line, message: amount === 0 ? 'Amount is zero.' : 'Unreadable amount.' })
      return
    }
    rows.push({ line, date: d, description: desc, amount: Math.round(amount * 100) / 100 })
  })
  return { rows, errors, delimiter, columns }
}

function quote(value: string): string {
  return /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Exports transactions as a comma-separated file with a header row. */
export function toCsv(transactions: readonly Transaction[], accounts: readonly { id: string; name: string }[] = []): string {
  const accountName = new Map(accounts.map((a) => [a.id, a.name]))
  const header = ['Date', 'Description', 'Merchant', 'Category', 'Amount', 'Account', 'Note']
  const lines = transactions.map((t) =>
    [t.date, t.description, t.merchant, getCategory(t.categoryId).label, t.amount.toFixed(2), accountName.get(t.accountId) ?? t.accountId, t.note ?? '']
      .map(quote)
      .join(','),
  )
  return [header.join(','), ...lines].join('\n')
}

/** A small example file for the import dialog. */
export const SAMPLE_CSV = [
  'Date;Description;Debit;Credit',
  '{d1};"SQ *BLUE BOTTLE 0423";5,75;',
  '{d2};"NETFLIX.COM";17,99;',
  '{d3};"ACH CREDIT ACME CORP INVOICE 2231";;1.250,00',
  '{d3};"POS RIVERSIDE HARDWARE";42,10;',
].join('\n')

/** Fills the sample file with recent dates relative to `today`. */
export function sampleCsv(today: ISODate): string {
  const [y, m] = today.split('-').map(Number)
  const day = (n: number) => `${String(n).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
  const d = Number(today.slice(8, 10))
  return SAMPLE_CSV.replace('{d1}', day(Math.max(1, d - 3)))
    .replace('{d2}', day(Math.max(1, d - 2)))
    .replaceAll('{d3}', day(Math.max(1, d - 1)))
}

// [days before today, description, amount]; one row has a "Pending" date, as some banks export it.
const SAMPLE_STATEMENT_ROWS: [number | 'pending', string, string][] = [
  [1, 'STARBUCKS STORE 05812', '-6.45'],
  [1, 'UBER *TRIP HELP.UBER.COM', '-18.20'],
  [2, "TRADER JOE'S #552", '-64.37'],
  [3, 'NETFLIX.COM', '-17.99'],
  [3, 'ADOBE *CREATIVE CLOUD', '-59.99'],
  [4, 'ACH CREDIT ACME STUDIO INVOICE 2231', '1,250.00'],
  [5, 'SQ *BLUE BOTTLE 0423', '-5.75'],
  [5, 'POS RIVERSIDE HARDWARE #0412', '-42.10'],
  [6, 'SHELL OIL 57444', '-48.20'],
  [7, 'SPOTIFY USA', '-11.99'],
  [8, 'WHOLEFDS MKT 10233', '-87.12'],
  [9, 'VERIZON WIRELESS PAYMENT', '-65.00'],
  [10, 'ACH CREDIT 88213 J MORALES', '300.00'],
  [11, 'AMZN MKTP US*2K4LZ0', '-23.99'],
  [12, 'CHIPOTLE 1189', '-13.85'],
  [13, 'ONLINE TRANSFER TO SAVINGS XXXX4410', '-200.00'],
  [14, 'GITHUB INC', '-4.00'],
  [15, 'LYFT *RIDE TUE 8PM', '-14.60'],
  [16, 'PG&E WEB ONLINE', '-92.44'],
  [17, 'VENMO *PAYMENT K NGUYEN', '-40.00'],
  [18, 'MONTHLY SERVICE FEE', '-12.00'],
  [19, 'COSTCO WHSE #0481', '-134.56'],
  [20, 'INTEREST PAYMENT', '2.14'],
  [21, 'TST* LA TAQUERIA SF', '-21.30'],
  ['pending', 'AMAZON PRIME*1T2AB', '-14.99'],
]

/**
 * A realistic 25-row bank export (US dates, signed amounts) for trying the importer:
 * a few rows the categoriser is unsure about and one row it cannot read.
 */
export function sampleStatement(today: ISODate): string {
  const [y, m, d] = today.split('-').map(Number)
  const base = Date.UTC(y, m - 1, d)
  const usDate = (daysAgo: number) => {
    const dt = new Date(base - daysAgo * 86_400_000)
    return `${String(dt.getUTCMonth() + 1).padStart(2, '0')}/${String(dt.getUTCDate()).padStart(2, '0')}/${dt.getUTCFullYear()}`
  }
  const lines = SAMPLE_STATEMENT_ROWS.map(([when, description, amount]) =>
    [when === 'pending' ? 'Pending' : usDate(when), quote(description), quote(amount)].join(','),
  )
  return ['Date,Description,Amount', ...lines].join('\n')
}
