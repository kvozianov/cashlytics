import { addDays, makeISODate, weekday } from './dates'
import type { ISODate } from './types'

export interface QuickAddParsed {
  description: string
  /** Signed: negative for spending, positive for income. */
  amount: number
  date: ISODate
  kind: 'income' | 'expense'
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
}
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const INCOME_WORDS = /\b(received|refund|salary|paycheck|income|paid me|got paid|invoice paid|deposit)\b/i

/** Most recent date (today or earlier) for a day + month; rolls back a year if it would be in the future. */
function pastDate(day: number, month: number, today: ISODate): ISODate | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  let year = Number(today.slice(0, 4))
  let iso = makeISODate(year, month, day)
  if (Number(iso.slice(8, 10)) !== day) return null
  if (iso > today) {
    year--
    iso = makeISODate(year, month, day)
  }
  return iso
}

interface DateMatch {
  date: ISODate
  /** Text that was consumed. */
  match: string
}

function findDate(text: string, today: ISODate): DateMatch | null {
  const lower = text.toLowerCase()
  const patterns: [RegExp, (m: RegExpExecArray) => ISODate | null][] = [
    [/\b(?:on\s+)?today\b/, () => today],
    [/\b(?:on\s+)?yesterday\b/, () => addDays(today, -1)],
    [/\b(\d{1,2})\s+days?\s+ago\b/, (m) => addDays(today, -Number(m[1]))],
    [/\b(?:on\s+)?(\d{4})-(\d{2})-(\d{2})\b/, (m) => {
      const iso = makeISODate(Number(m[1]), Number(m[2]), Number(m[3]))
      return iso === `${m[1]}-${m[2]}-${m[3]}` ? iso : null
    }],
    [/\b(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/, (m) =>
      pastDate(Number(m[1]), MONTHS[m[2]], today)],
    [/\b(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/, (m) =>
      pastDate(Number(m[2]), MONTHS[m[1]], today)],
    [/\b(?:on\s+|last\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/, (m) => {
      const target = WEEKDAYS.indexOf(m[1])
      let back = (weekday(today) - target + 7) % 7
      if (back === 0) back = 7
      return addDays(today, -back)
    }],
  ]
  for (const [re, toDate] of patterns) {
    const m = re.exec(lower)
    if (!m) continue
    const date = toDate(m)
    if (date) return { date, match: text.slice(m.index, m.index + m[0].length) }
  }
  return null
}

const AMOUNT = /(^|\s)([+\-−]?)\$?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?)\$?(?=\s|$)/

/**
 * Parses a one-line entry such as `coffee 4.50 yesterday`, `+1200 acme invoice` or
 * `uber 18 on 3 nov`. Returns null when no amount is found.
 */
export function parseQuickAdd(input: string, today: ISODate): QuickAddParsed | null {
  let text = input.trim().replace(/\s+/g, ' ')
  if (!text) return null

  const dateMatch = findDate(text, today)
  if (dateMatch) text = text.replace(dateMatch.match, ' ')

  const m = AMOUNT.exec(text)
  if (!m) return null
  let raw = m[3]
  // `4,50` is a decimal comma; `1,200` is a thousands separator.
  raw = /^\d+,\d{1,2}$/.test(raw) ? raw.replace(',', '.') : raw.replace(/,/g, '')
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) return null
  text = (text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length)).trim()

  const sign = m[2]
  const kind: QuickAddParsed['kind'] = sign === '+' ? 'income' : sign === '-' || sign === '−' ? 'expense' : INCOME_WORDS.test(text) ? 'income' : 'expense'

  const description = text
    .replace(/\s+/g, ' ')
    .replace(/^(for|at|on|to|from)\s+/i, '')
    .replace(/\s+(for|at|on|to|from)$/i, '')
    .trim()

  return {
    description: description ? description.charAt(0).toUpperCase() + description.slice(1) : kind === 'income' ? 'Income' : 'Expense',
    amount: Math.round((kind === 'income' ? value : -value) * 100) / 100,
    date: dateMatch?.date ?? today,
    kind,
  }
}

export const QUICK_ADD_EXAMPLES = ['coffee 4.50 yesterday', '+1200 acme invoice', 'uber 18 on 3 nov', 'groceries 62.40 saturday']
