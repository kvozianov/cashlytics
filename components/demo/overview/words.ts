import type { Period } from '@/lib/demo/types'
import type { WeakPoint } from '@/lib/demo/insights'

export const PERIOD_WORDS: Record<Period, { inPeriod: string; short: string; previous: string; before: string }> = {
  'this-month': { inPeriod: 'this month', short: 'this month', previous: 'vs same days last month', before: 'the same days last month' },
  'last-3-months': { inPeriod: 'over the last three months', short: 'last 3 months', previous: 'vs the 3 months before', before: 'the 3 months before' },
  ytd: { inPeriod: 'so far this year', short: 'year to date', previous: 'vs same period last year', before: 'this time last year' },
  'last-12-months': { inPeriod: 'over the last twelve months', short: 'last 12 months', previous: 'vs the 12 months before', before: 'the year before' },
}

/** "more than the 3 months before" — a change in words, no figure. */
export function changeWords(now: number, before: number, period: Period): string {
  const ref = PERIOD_WORDS[period].before
  const base = Math.max(Math.abs(before), 1)
  const rel = (now - before) / base
  if (Math.abs(rel) < 0.05) return `about the same as ${ref}`
  return `${now > before ? 'more' : 'less'} than ${ref}`
}

/** The weak point as a short clause that can end a sentence: "you are $5,600 short on tax". */
export function weakPointClause(wp: WeakPoint): string {
  switch (wp.id) {
    case 'tax-shortfall':
      return `your tax is on course to end the year ${wp.metric}`
    case 'late-payer':
      return `${wp.title.replace(/ pays late$/, '')} is paying ${wp.metric}`
    case 'low-buffer':
      return `your savings would last only ${wp.metric}`
    case 'thin-runway':
      return `cash covers only ${wp.metric}`
    case 'subscription-creep':
      return `subscriptions now cost ${wp.metric}`
    case 'cost-growth':
      return `${wp.title.replace(/ rising faster than income$/, '').toLowerCase()} costs are climbing ${wp.metric}`
    case 'low-savings-rate':
      return `only ${wp.metric} of income stays with you`
    case 'over-budget':
      return wp.title.toLowerCase()
    case 'income-concentration':
      return `${wp.metric} of income comes from one client`
  }
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
