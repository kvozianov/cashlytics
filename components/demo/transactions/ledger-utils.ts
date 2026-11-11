import { periodRange, type DateRange } from '@/lib/demo/analytics'
import { CATEGORIES, getCategory, isCategoryId } from '@/lib/demo/categories'
import { endOfMonth, isValidISODate } from '@/lib/demo/dates'
import type { CategoryId, ISODate, MonthKey, Period, Transaction } from '@/lib/demo/types'
import { needsReview } from '@/lib/demo/categorize'

export const PAGE_SIZE = 25

export type SortKey = 'newest' | 'oldest' | 'largest' | 'smallest'
export type FlowType = 'all' | 'in' | 'out'
/** `period` follows the global period selector; `all` is the whole history; otherwise a month. */
export type RangeKey = 'period' | 'all' | MonthKey
export type View = 'ledger' | 'review' | 'rules'

export interface LedgerFilters {
  q: string
  type: FlowType
  categories: CategoryId[]
  group: 'business' | 'personal' | null
  account: string | null
  /** Absolute amount bounds. */
  min: number | null
  max: number | null
  unreviewed: boolean
  range: RangeKey
  sort: SortKey
}

export interface LedgerUrlState {
  filters: LedgerFilters
  view: View
  page: number
  tx: string | null
}

export const EMPTY_FILTERS: LedgerFilters = {
  q: '',
  type: 'all',
  categories: [],
  group: null,
  account: null,
  min: null,
  max: null,
  unreviewed: false,
  range: 'period',
  sort: 'newest',
}

const SORTS: SortKey[] = ['newest', 'oldest', 'largest', 'smallest']

function num(v: string | null): number | null {
  if (v === null || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function parseLedgerParams(params: URLSearchParams): LedgerUrlState {
  const month = params.get('month')
  const range: RangeKey = month && /^\d{4}-\d{2}$/.test(month) ? month : params.get('range') === 'all' ? 'all' : 'period'
  const type = params.get('type')
  const group = params.get('group')
  const sort = params.get('sort') as SortKey | null
  const view = params.get('view')
  return {
    filters: {
      q: params.get('q') ?? '',
      type: type === 'in' || type === 'out' ? type : 'all',
      categories: (params.get('category') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(isCategoryId),
      group: group === 'business' || group === 'personal' ? group : null,
      account: params.get('account') || null,
      min: num(params.get('min')),
      max: num(params.get('max')),
      unreviewed: params.get('unreviewed') === '1',
      range,
      sort: sort && SORTS.includes(sort) ? sort : 'newest',
    },
    view: params.get('review') === '1' || view === 'review' ? 'review' : view === 'rules' ? 'rules' : 'ledger',
    page: Math.max(1, Math.floor(Number(params.get('page')) || 1)),
    tx: params.get('tx') || null,
  }
}

const OWN_KEYS = ['q', 'type', 'category', 'group', 'account', 'min', 'max', 'unreviewed', 'month', 'range', 'sort', 'view', 'review', 'page', 'tx']

/** Writes the page state into a query string, keeping any params that belong to someone else. */
export function toLedgerSearch(state: LedgerUrlState, current: URLSearchParams): string {
  const p = new URLSearchParams(current)
  for (const k of OWN_KEYS) p.delete(k)
  const f = state.filters
  if (state.view !== 'ledger') p.set('view', state.view)
  if (f.q.trim()) p.set('q', f.q.trim())
  if (f.type !== 'all') p.set('type', f.type)
  if (f.categories.length) p.set('category', f.categories.join(','))
  if (f.group) p.set('group', f.group)
  if (f.account) p.set('account', f.account)
  if (f.min !== null) p.set('min', String(f.min))
  if (f.max !== null) p.set('max', String(f.max))
  if (f.unreviewed) p.set('unreviewed', '1')
  if (f.range === 'all') p.set('range', 'all')
  else if (f.range !== 'period') p.set('month', f.range)
  if (f.sort !== 'newest') p.set('sort', f.sort)
  if (state.page > 1) p.set('page', String(state.page))
  if (state.tx) p.set('tx', state.tx)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export function rangeFor(range: RangeKey, period: Period, today: ISODate): DateRange | null {
  if (range === 'all') return null
  if (range === 'period') return periodRange(period, today)
  const start = `${range}-01`
  if (!isValidISODate(start)) return null
  return { start, end: endOfMonth(start) }
}

/** Amount-like queries (`4.50`, `$1,250`, `-18`) also match the figure itself. */
function amountQuery(q: string): string | null {
  const s = q.replace(/[$,\s]/g, '').replace('−', '-')
  if (!/^[+-]?\d+(\.\d{0,2})?$/.test(s)) return null
  return s.replace(/^[+-]/, '')
}

export function matchesQuery(t: Transaction, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const figure = amountQuery(needle)
  if (figure !== null && Math.abs(t.amount).toFixed(2).startsWith(figure)) return true
  return (
    t.merchant.toLowerCase().includes(needle) ||
    t.description.toLowerCase().includes(needle) ||
    (t.note?.toLowerCase().includes(needle) ?? false) ||
    getCategory(t.categoryId).label.toLowerCase().includes(needle)
  )
}

export function filterTransactions(list: readonly Transaction[], f: LedgerFilters, range: DateRange | null): Transaction[] {
  const cats = f.categories.length ? new Set(f.categories) : null
  const out = list.filter((t) => {
    if (range && (t.date < range.start || t.date > range.end)) return false
    if (f.type === 'in' && t.amount <= 0) return false
    if (f.type === 'out' && t.amount >= 0) return false
    if (cats && !cats.has(t.categoryId)) return false
    if (f.group && getCategory(t.categoryId).group !== f.group) return false
    if (f.account && t.accountId !== f.account) return false
    const abs = Math.abs(t.amount)
    if (f.min !== null && abs < f.min) return false
    if (f.max !== null && abs > f.max) return false
    if (f.unreviewed && !needsReview(t)) return false
    return matchesQuery(t, f.q)
  })
  switch (f.sort) {
    case 'newest':
      return out
    case 'oldest':
      return out.reverse()
    case 'largest':
      return out.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    case 'smallest':
      return out.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount))
  }
}

export function activeFilterCount(f: LedgerFilters): number {
  return (
    (f.type !== 'all' ? 1 : 0) +
    f.categories.length +
    (f.group ? 1 : 0) +
    (f.account ? 1 : 0) +
    (f.min !== null || f.max !== null ? 1 : 0) +
    (f.unreviewed ? 1 : 0)
  )
}

export type ReasonLayer = 'you' | 'rule' | 'dictionary' | 'keyword' | 'invoice' | 'fallback'

/** Which layer of the categoriser produced a reason string. */
export function reasonLayer(reason: string): ReasonLayer {
  if (reason === 'Chosen by you') return 'you'
  if (reason.startsWith('Your rule')) return 'rule'
  if (reason.startsWith('Matched')) return 'dictionary'
  if (reason.startsWith('Keyword')) return 'keyword'
  if (reason.startsWith('Linked to invoice')) return 'invoice'
  return 'fallback'
}

export const LAYER_LABEL: Record<ReasonLayer, string> = {
  you: 'Set by you',
  rule: 'Your rule',
  dictionary: 'Merchant dictionary',
  keyword: 'Keyword pattern',
  invoice: 'Linked invoice',
  fallback: 'No rule matched',
}

/** Up to five categories to offer for a transaction in the review queue, best first. */
export function suggestionsFor(tx: Transaction, all: readonly Transaction[], ranked: { in: CategoryId[]; out: CategoryId[] }): CategoryId[] {
  const out: CategoryId[] = []
  const push = (id: CategoryId) => {
    if (id !== 'uncategorised' && !out.includes(id) && out.length < 5) out.push(id)
  }
  push(tx.categoryId)
  const sameMerchant = new Map<CategoryId, number>()
  for (const t of all) if (t.merchant === tx.merchant && t.reviewed) sameMerchant.set(t.categoryId, (sameMerchant.get(t.categoryId) ?? 0) + 1)
  ;[...sameMerchant.entries()].sort((a, b) => b[1] - a[1]).forEach(([id]) => push(id))
  if (/venmo|zelle|transfer|paypal/i.test(tx.description)) push('transfer')
  for (const id of tx.amount > 0 ? ranked.in : ranked.out) push(id)
  return out
}

/** Categories ranked by how often they are used, separately for money in and money out. */
export function rankCategories(all: readonly Transaction[]): { in: CategoryId[]; out: CategoryId[] } {
  const inCount = new Map<CategoryId, number>()
  const outCount = new Map<CategoryId, number>()
  for (const t of all) {
    if (t.categoryId === 'uncategorised') continue
    const m = t.amount > 0 ? inCount : outCount
    m.set(t.categoryId, (m.get(t.categoryId) ?? 0) + 1)
  }
  const order = (m: Map<CategoryId, number>, fallback: CategoryId[]) => {
    const ids = [...m.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
    for (const id of fallback) if (!ids.includes(id)) ids.push(id)
    return ids
  }
  return {
    in: order(inCount, ['client-income', 'sales', 'other-income', 'transfer']),
    out: order(
      outCount,
      CATEGORIES.filter((c) => c.kind === 'expense' && c.id !== 'uncategorised').map((c) => c.id),
    ),
  }
}
