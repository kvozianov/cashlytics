import type { ISODate, MonthKey } from './types'

// All date maths runs on UTC midnights so results never depend on the viewer's time zone.

const DAY = 86_400_000

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date of a JS Date as `YYYY-MM-DD`. */
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function fromUTC(date: Date): ISODate {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  return fromUTC(parseISODate(iso)) === iso
}

export function makeISODate(year: number, month: number, day: number): ISODate {
  return fromUTC(new Date(Date.UTC(year, month - 1, day)))
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromUTC(new Date(parseISODate(iso).getTime() + days * DAY))
}

/** Adds calendar months, clamping the day to the target month's length. */
export function addMonths(iso: ISODate, months: number): ISODate {
  const d = parseISODate(iso)
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1))
  const last = daysInMonth(monthKey(fromUTC(target)))
  return makeISODate(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(d.getUTCDate(), last))
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISODate(a).getTime() - parseISODate(b).getTime()) / DAY)
}

export function monthKey(iso: ISODate): MonthKey {
  return iso.slice(0, 7)
}

export function yearOf(iso: ISODate): number {
  return Number(iso.slice(0, 4))
}

export function startOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`
}

export function endOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-${pad(daysInMonth(monthKey(iso)))}`
}

export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function addMonthsToKey(month: MonthKey, n: number): MonthKey {
  return monthKey(addMonths(`${month}-01`, n))
}

/** Month keys from `from` to `to`, inclusive. */
export function monthRange(from: MonthKey, to: MonthKey): MonthKey[] {
  const out: MonthKey[] = []
  for (let m = from; m <= to; m = addMonthsToKey(m, 1)) out.push(m)
  return out
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(iso: ISODate): number {
  return parseISODate(iso).getUTCDay()
}

export function isWeekend(iso: ISODate): boolean {
  const d = weekday(iso)
  return d === 0 || d === 6
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b
}

/** Iterates every date from `from` to `to`, inclusive. */
export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

/** Calendar quarter (1–4) of a date. */
export function quarterOf(iso: ISODate): 1 | 2 | 3 | 4 {
  return (Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1) as 1 | 2 | 3 | 4
}
