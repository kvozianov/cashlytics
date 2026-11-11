import { diffDays, parseISODate } from './dates'
import type { ISODate, MonthKey } from './types'

const MINUS = '−'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const usdWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export interface MoneyOptions {
  /** Drop cents. Default: false. */
  whole?: boolean
}

/** `$1,234.50`; negatives use a real minus sign: `−$12.00`. */
export function money(value: number, opts: MoneyOptions = {}): string {
  const fmt = opts.whole ? usdWhole : usd
  const text = fmt.format(Math.abs(value))
  return value < 0 && Math.abs(value) >= (opts.whole ? 0.5 : 0.005) ? `${MINUS}${text}` : text
}

/** `+$1,234.50` / `−$1,234.50`, for amounts where the direction matters. */
export function signedMoney(value: number, opts: MoneyOptions = {}): string {
  const text = (opts.whole ? usdWhole : usd).format(Math.abs(value))
  if (Math.abs(value) < 0.005) return text
  return `${value > 0 ? '+' : MINUS}${text}`
}

/** Short form for axes and tight spaces: `$950`, `$12.4k`, `$1.2M`. */
export function moneyCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? MINUS : ''
  if (abs >= 1_000_000) return `${sign}$${trim(abs / 1_000_000)}M`
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000)}k`
  if (abs >= 1_000) return `${sign}$${trim(abs / 1000)}k`
  return `${sign}$${Math.round(abs)}`
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '')
}

/** `0.123` → `12%`. */
export function pct(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`
}

/** `0.05` → `+5%`, `-0.1` → `−10%`. */
export function signedPct(value: number, digits = 0): string {
  const text = `${Math.abs(value * 100).toFixed(digits)}%`
  if (Number(text.replace('%', '')) === 0) return text
  return `${value > 0 ? '+' : MINUS}${text}`
}

/** Percentage-point change: `0.03` → `+3 pp`. */
export function signedPoints(value: number): string {
  const n = Math.round(value * 100)
  return `${n > 0 ? '+' : n < 0 ? MINUS : ''}${Math.abs(n)} pp`
}

export function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? singular : plural}`
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** `3 Nov 2026`; `{ year: false }` → `3 Nov`. */
export function formatDate(iso: ISODate, opts: { year?: boolean; weekday?: boolean } = {}): string {
  const d = parseISODate(iso)
  const parts = [`${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`]
  if (opts.year !== false) parts.push(String(d.getUTCFullYear()))
  const text = parts.join(' ')
  return opts.weekday ? `${WEEKDAYS[d.getUTCDay()]} ${text}` : text
}

/** `2026-03` → `Mar 2026` (or `March 2026` with `long`). */
export function formatMonth(month: MonthKey, opts: { long?: boolean; year?: boolean } = {}): string {
  const m = Number(month.slice(5, 7)) - 1
  const name = opts.long ? LONG_MONTHS[m] : SHORT_MONTHS[m]
  return opts.year === false ? name : `${name} ${month.slice(0, 4)}`
}

/** `today`, `yesterday`, `in 3 days`, `12 days ago`. */
export function relativeDays(iso: ISODate, today: ISODate): string {
  const d = diffDays(iso, today)
  if (d === 0) return 'today'
  if (d === -1) return 'yesterday'
  if (d === 1) return 'tomorrow'
  return d > 0 ? `in ${d} days` : `${-d} days ago`
}

/** Months as `2.4 months` / `1 month`. */
export function formatMonths(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return `${rounded} ${rounded === 1 ? 'month' : 'months'}`
}
