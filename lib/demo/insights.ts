import {
  averageMonth,
  categorySpendForMonth,
  flowOf,
  liquidBalance,
  monthlySeries,
  type MonthPoint,
} from './analytics'
import { getCategory } from './categories'
import { addDays, addMonthsToKey, diffDays, monthKey } from './dates'
import { clientStats, receivablesSummary } from './invoices'
import { getPersona } from './personas'
import { estimateTax } from './tax'
import type { CategoryId, DemoState, ISODate, MonthKey, Transaction } from './types'

// Rule-based analysis of the user's own numbers. Every threshold is spelled out below.

const round2 = (n: number) => Math.round(n * 100) / 100
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(n))
const pctText = (n: number) => `${Math.round(n * 100)}%`

type State = Pick<DemoState, 'personaId' | 'transactions' | 'accounts' | 'invoices' | 'clients' | 'budgets' | 'taxSettings'>

/** Complete calendar months before today's month, oldest first. */
function completeMonths(state: State, today: ISODate, count: number): MonthPoint[] {
  return monthlySeries(state.transactions, today, count + 1).slice(0, count)
}

/** Spending that recurs every month (excludes tax payments, which are lumpy). */
function averageMonthlyCosts(state: State, today: ISODate, months = 3): number {
  const last = monthKey(today)
  const first = addMonthsToKey(last, -months)
  let total = 0
  for (const t of state.transactions) {
    const m = monthKey(t.date)
    if (m < first || m >= last || t.categoryId === 'tax-payment') continue
    total += flowOf(t).expense
  }
  return round2(total / months)
}

// ---------------------------------------------------------------------------
// Subscriptions

export interface Subscription {
  merchant: string
  categoryId: CategoryId
  cadence: 'monthly' | 'yearly'
  /** Latest charge. */
  amount: number
  monthlyCost: number
  yearlyCost: number
  count: number
  firstDate: ISODate
  lastDate: ISODate
  nextDate: ISODate
  /** Charged within the expected interval. */
  active: boolean
  priceChange: { from: number; to: number; since: ISODate } | null
  transactionIds: string[]
}

const SUBSCRIPTION_CATEGORIES = new Set<CategoryId>(['subscriptions', 'software', 'health-fitness', 'education', 'entertainment'])

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Recurring same-merchant charges with a regular monthly or yearly rhythm. */
export function detectSubscriptions(state: Pick<DemoState, 'transactions'>, today: ISODate): Subscription[] {
  const groups = new Map<string, Transaction[]>()
  for (const t of state.transactions) {
    if (t.amount >= 0 || !SUBSCRIPTION_CATEGORIES.has(t.categoryId)) continue
    const list = groups.get(t.merchant) ?? []
    list.push(t)
    groups.set(t.merchant, list)
  }
  const result: Subscription[] = []
  for (const [merchant, list] of groups) {
    if (list.length < 2) continue
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
    const gaps = sorted.slice(1).map((t, i) => diffDays(t.date, sorted[i].date))
    const gap = median(gaps)
    const cadence = gap >= 26 && gap <= 35 ? 'monthly' : gap >= 350 && gap <= 380 ? 'yearly' : null
    if (!cadence) continue
    const amounts = sorted.map((t) => -t.amount)
    const typical = median(amounts)
    // Charges that vary a lot (groceries at the same shop) are not subscriptions.
    if (amounts.filter((a) => Math.abs(a - typical) / typical > 0.3).length > amounts.length * 0.25) continue
    const last = sorted[sorted.length - 1]
    const amount = -last.amount
    const first = amounts[0]
    let priceChange: Subscription['priceChange'] = null
    if (amount - first > 0.5) {
      const since = sorted.find((t) => -t.amount === amount)!.date
      priceChange = { from: first, to: amount, since }
    }
    const interval = cadence === 'monthly' ? 30 : 365
    result.push({
      merchant,
      categoryId: last.categoryId,
      cadence,
      amount,
      monthlyCost: round2(cadence === 'monthly' ? amount : amount / 12),
      yearlyCost: round2(cadence === 'monthly' ? amount * 12 : amount),
      count: sorted.length,
      firstDate: sorted[0].date,
      lastDate: last.date,
      nextDate: addDays(last.date, cadence === 'monthly' ? Math.round(gap) : 365),
      active: diffDays(today, last.date) <= interval + 10,
      priceChange,
      transactionIds: sorted.map((t) => t.id),
    })
  }
  return result.sort((a, b) => b.monthlyCost - a.monthlyCost)
}

/** Total of subscription charges in one calendar month. */
function subscriptionSpendInMonth(subs: Subscription[], transactions: readonly Transaction[], month: MonthKey): number {
  const ids = new Set(subs.filter((s) => s.cadence === 'monthly').flatMap((s) => s.transactionIds))
  return round2(transactions.reduce((s, t) => (ids.has(t.id) && monthKey(t.date) === month ? s - t.amount : s), 0))
}

// ---------------------------------------------------------------------------
// Anomalies

export interface Anomaly {
  categoryId: CategoryId
  month: MonthKey
  amount: number
  /** Average of the three months before. */
  average: number
  /** Relative change, 0.5 = +50 %. */
  change: number
}

/** Categories where the last complete month was well above its trailing three-month average. */
export function anomalies(state: Pick<DemoState, 'transactions'>, today: ISODate): Anomaly[] {
  const month = addMonthsToKey(monthKey(today), -1)
  const current = categorySpendForMonth(state.transactions, month)
  const history = [1, 2, 3].map((i) => categorySpendForMonth(state.transactions, addMonthsToKey(month, -i)))
  const out: Anomaly[] = []
  for (const [categoryId, amount] of current) {
    if (categoryId === 'tax-payment' || categoryId === 'uncategorised') continue
    const average = history.reduce((s, h) => s + (h.get(categoryId) ?? 0), 0) / 3
    if (average <= 0) continue
    const change = (amount - average) / average
    if (change >= 0.35 && amount - average >= 75) out.push({ categoryId, month, amount: round2(amount), average: round2(average), change })
  }
  return out.sort((a, b) => b.amount - b.average - (a.amount - a.average))
}

// ---------------------------------------------------------------------------
// Forecast

export interface ForecastScenario {
  /** Change in monthly income, 0.1 = +10 %. */
  incomeChangePct?: number
  /** Extra monthly cost, USD. */
  extraMonthlyCost?: number
}

export interface ForecastPoint {
  month: MonthKey
  balance: number
  income: number
  expenses: number
  net: number
}

export interface Forecast {
  startBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  /** Monthly money moved into tax reserves (not spent, but not available either). */
  monthlySetAside: number
  monthlyNet: number
  points: ForecastPoint[]
  endBalance: number
  /** Months until the balance reaches zero at the current pace; null when the balance grows. */
  runwayMonths: number | null
}

/**
 * Projects the spendable balance from the average of the last six complete months.
 * Simple on purpose: no seasonality, no one-offs.
 */
export function forecast(state: Pick<DemoState, 'transactions' | 'accounts'>, today: ISODate, months = 3, scenario: ForecastScenario = {}): Forecast {
  const avg = averageMonth(state.transactions, today, 6)
  const taxIds = new Set(state.accounts.filter((a) => a.purpose === 'tax').map((a) => a.id))
  const last = monthKey(today)
  const first = addMonthsToKey(last, -6)
  let setAside = 0
  for (const t of state.transactions) {
    const m = monthKey(t.date)
    if (m >= first && m < last && taxIds.has(t.accountId) && t.categoryId === 'transfer') setAside += t.amount
  }
  const monthlySetAside = round2(Math.max(0, setAside / 6))
  const monthlyIncome = round2(avg.income * (1 + (scenario.incomeChangePct ?? 0)))
  const monthlyExpenses = round2(avg.expenses + (scenario.extraMonthlyCost ?? 0))
  const monthlyNet = round2(monthlyIncome - monthlyExpenses - monthlySetAside)
  const startBalance = liquidBalance(state, today)
  const points: ForecastPoint[] = []
  let balance = startBalance
  for (let i = 1; i <= months; i++) {
    balance = round2(balance + monthlyNet)
    points.push({ month: addMonthsToKey(last, i), balance, income: monthlyIncome, expenses: monthlyExpenses, net: monthlyNet })
  }
  return {
    startBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySetAside,
    monthlyNet,
    points,
    endBalance: balance,
    runwayMonths: monthlyNet < 0 ? Math.max(0, startBalance / -monthlyNet) : null,
  }
}

// ---------------------------------------------------------------------------
// Health score

export type HealthStatus = 'good' | 'fair' | 'poor'

export interface HealthComponent {
  id: 'savings-rate' | 'buffer' | 'income-stability' | 'tax-readiness' | 'budgets' | 'receivables'
  label: string
  /** 0..100 */
  score: number
  /** Relative weight; weights of the included components sum to 1. */
  weight: number
  /** Raw value, e.g. 0.12 for a 12 % savings rate or 2.4 months. */
  value: number
  /** Formatted value, e.g. `12%` or `2.4 months`. */
  display: string
  status: HealthStatus
  /** One sentence explaining the number. */
  detail: string
}

export interface HealthScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'E'
  label: string
  components: HealthComponent[]
}

function statusOf(score: number): HealthStatus {
  return score >= 70 ? 'good' : score >= 45 ? 'fair' : 'poor'
}

/** Least-squares trend of a monthly series: change per year as a share of the mean, and R². */
function trendOf(values: number[]): { share: number; r2: number } {
  const n = values.length
  const mean = values.reduce((s, v) => s + v, 0) / n
  if (mean <= 0 || n < 3) return { share: 0, r2: 0 }
  const xm = (n - 1) / 2
  let num = 0
  let den = 0
  let total = 0
  values.forEach((v, i) => {
    num += (i - xm) * (v - mean)
    den += (i - xm) ** 2
    total += (v - mean) ** 2
  })
  const slope = num / den
  const explained = slope * slope * den
  return { share: (slope * 12) / mean, r2: total > 0 ? explained / total : 0 }
}

export function healthScore(state: State, today: ISODate): HealthScore {
  const persona = getPersona(state.personaId)
  const isBusiness = persona.kind === 'business'
  const six = completeMonths(state, today, 6)
  const twelve = completeMonths(state, today, 12)
  const income6 = six.reduce((s, m) => s + m.income, 0)
  const net6 = six.reduce((s, m) => s + m.net, 0)
  const components: Omit<HealthComponent, 'weight'>[] = []
  const weights: Record<HealthComponent['id'], number> = {
    'savings-rate': 25,
    buffer: 20,
    'income-stability': 15,
    'tax-readiness': 15,
    budgets: 10,
    receivables: 15,
  }

  const rate = income6 > 0 ? net6 / income6 : 0
  const rateTarget = isBusiness ? 0.15 : 0.2
  const rateScore = Math.round(clamp01(rate / rateTarget) * 100)
  components.push({
    id: 'savings-rate',
    label: isBusiness ? 'Profit margin' : 'Savings rate',
    score: rateScore,
    value: rate,
    display: pctText(rate),
    status: statusOf(rateScore),
    detail: isBusiness
      ? `Over the last six months ${pctText(rate)} of revenue was left after costs. ${pctText(rateTarget)} or more gives room for slow months.`
      : `Over the last six months you kept ${pctText(rate)} of what came in. ${pctText(rateTarget)} is a healthy target.`,
  })

  const costs = averageMonthlyCosts(state, today)
  const liquid = liquidBalance(state, today)
  const months = costs > 0 ? liquid / costs : 0
  const bufferTarget = isBusiness ? 3 : 6
  const bufferScore = Math.round(clamp01(months / bufferTarget) * 100)
  components.push({
    id: 'buffer',
    label: isBusiness ? 'Cash runway' : 'Emergency buffer',
    score: bufferScore,
    value: months,
    display: `${months.toFixed(1)} months`,
    status: statusOf(bufferScore),
    detail: `${usd(liquid)} available covers ${months.toFixed(1)} months of typical costs (${usd(costs)} a month). Aim for ${bufferTarget}.`,
  })

  const incomes = twelve.map((m) => m.income)
  const mean = incomes.reduce((s, v) => s + v, 0) / (incomes.length || 1)
  const sd = Math.sqrt(incomes.reduce((s, v) => s + (v - mean) ** 2, 0) / (incomes.length || 1))
  const cv = mean > 0 ? sd / mean : 1
  const stabilityScore = Math.round(clamp01(1 - (cv - 0.1) / 0.7) * 100)
  components.push({
    id: 'income-stability',
    label: 'Income stability',
    score: stabilityScore,
    value: cv,
    display: cv < 0.15 ? 'Steady' : cv < 0.4 ? 'Uneven' : 'Irregular',
    status: statusOf(stabilityScore),
    detail: `Monthly income typically moves ±${pctText(cv)} around its average of ${usd(mean)}.`,
  })

  const tax = estimateTax(state, Number(today.slice(0, 4)), today)
  const covered = tax.paid + tax.setAside
  const readiness = tax.estimatedTax > 0 ? covered / tax.estimatedTax : 1
  const taxScore = Math.round(clamp01(readiness) * 100)
  components.push({
    id: 'tax-readiness',
    label: 'Tax readiness',
    score: taxScore,
    value: readiness,
    display: pctText(Math.min(readiness, 9.99)),
    status: statusOf(taxScore),
    detail:
      tax.estimatedTax > 0
        ? `${usd(covered)} paid or set aside against an estimated ${usd(tax.estimatedTax)} of tax so far this year.`
        : 'No taxable profit so far this year.',
  })

  if (state.budgets.length) {
    const month = addMonthsToKey(monthKey(today), -1)
    const spend = categorySpendForMonth(state.transactions, month)
    const within = state.budgets.filter((b) => (spend.get(b.categoryId) ?? 0) <= b.monthlyLimit).length
    const share = within / state.budgets.length
    const budgetScore = Math.round(share * 100)
    components.push({
      id: 'budgets',
      label: 'Budgets kept',
      score: budgetScore,
      value: share,
      display: `${within} of ${state.budgets.length}`,
      status: statusOf(budgetScore),
      detail: `Last month ${within} of ${state.budgets.length} budgets stayed within their limit.`,
    })
  }

  const issued = state.invoices.filter((i) => i.status !== 'draft')
  if (issued.length >= 2) {
    const r = receivablesSummary(state.invoices, today)
    const stats = clientStats(state, today).filter((s) => s.avgDaysLate !== null)
    const worstLate = stats.reduce((m, s) => Math.max(m, s.avgDaysLate ?? 0), 0)
    const monthlyIncome = mean || 1
    const recScore = Math.round(clamp01(1 - r.overdue / monthlyIncome) * 70 + clamp01(1 - worstLate / 45) * 30)
    components.push({
      id: 'receivables',
      label: 'Getting paid',
      score: recScore,
      value: r.overdue,
      display: r.overdue > 0 ? `${usd(r.overdue)} overdue` : 'Nothing overdue',
      status: statusOf(recScore),
      detail:
        r.overdue > 0
          ? `${r.overdueCount} invoice${r.overdueCount === 1 ? '' : 's'} worth ${usd(r.overdue)} past due. The slowest client pays ${worstLate} days late on average.`
          : 'Clients are paying on time.',
    })
  }

  const totalWeight = components.reduce((s, c) => s + weights[c.id], 0)
  const withWeights: HealthComponent[] = components.map((c) => ({ ...c, weight: weights[c.id] / totalWeight }))
  const score = Math.round(withWeights.reduce((s, c) => s + c.score * c.weight, 0))
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'E'
  const label = { A: 'Strong', B: 'Good', C: 'Fair', D: 'Needs work', E: 'At risk' }[grade]
  return { score, grade, label, components: withWeights }
}

// ---------------------------------------------------------------------------
// Weak points

export interface WeakPoint {
  id:
    | 'tax-shortfall'
    | 'late-payer'
    | 'low-buffer'
    | 'thin-runway'
    | 'subscription-creep'
    | 'low-savings-rate'
    | 'cost-growth'
    | 'over-budget'
    | 'income-concentration'
  severity: 'high' | 'medium' | 'low'
  /** 0..100, used for sorting. */
  impact: number
  title: string
  /** Plain-language explanation with the user's own numbers. */
  detail: string
  /** Headline figure for the card, e.g. `$4,630 short`. */
  metric: string
  action: { label: string; href: string }
  lessonId: string
}

function severityOf(impact: number): WeakPoint['severity'] {
  return impact >= 55 ? 'high' : impact >= 30 ? 'medium' : 'low'
}

function weak(p: Omit<WeakPoint, 'severity'>): WeakPoint {
  const impact = Math.round(Math.min(100, Math.max(0, p.impact)))
  return { ...p, impact, severity: severityOf(impact) }
}

/** Finds the weak spots in the user's money, most important first. */
export function weakPoints(state: State, today: ISODate): WeakPoint[] {
  const persona = getPersona(state.personaId)
  const isBusiness = persona.kind === 'business'
  const out: WeakPoint[] = []
  const twelve = completeMonths(state, today, 12)
  const six = twelve.slice(-6)
  const monthlyIncome = six.reduce((s, m) => s + m.income, 0) / 6 || 1
  const costs = averageMonthlyCosts(state, today) || 1

  // Tax not covered
  const year = Number(today.slice(0, 4))
  const tax = estimateTax(state, year, today)
  const hasReserve = state.accounts.some((a) => a.purpose === 'tax')
  // With a tax reserve, judge the reserve; without one, only what is already past due.
  const uncovered = hasReserve ? Math.max(tax.shortfall, tax.projectedShortfall) : Math.max(0, tax.overdueAmount - tax.setAside)
  if (uncovered > Math.max(100, tax.projectedAnnualTax * 0.05)) {
    const overdue = tax.quarters.filter((q) => q.status === 'overdue')
    const overdueNote = overdue.length ? ` ${overdue.map((q) => q.label).join(', ')} ${overdue.length === 1 ? 'is' : 'are'} not fully paid.` : ''
    const detail = hasReserve
      ? `You move about ${pctText(tax.currentSetAsideRate)} of each payment into your tax reserve, but your profit needs about ${pctText(tax.suggestedSetAsideRate)}. Estimated tax for ${year} is ${usd(tax.projectedAnnualTax)}; ${usd(tax.paid)} is paid and ${usd(tax.setAside)} is set aside, so at this pace you will be about ${usd(uncovered)} short.${overdueNote}`
      : `Your taxable side income has built up ${usd(tax.estimatedTax)} of estimated tax this year and none of it is paid or set aside.${overdueNote} About ${pctText(tax.suggestedSetAsideRate)} of that income should go aside.`
    out.push(
      weak({
        id: 'tax-shortfall',
        impact: 30 + (uncovered / costs) * 40 + overdue.length * 5,
        title: 'Tax bill not covered',
        detail,
        metric: `${usd(uncovered)} short`,
        action: { label: 'Open tax planner', href: '/demo/tax' },
        lessonId: 'tax-set-aside',
      }),
    )
  }

  // Slow-paying client
  const stats = clientStats(state, today)
  const slow = stats
    .filter((s) => (s.avgDaysLate ?? 0) >= 14 || s.maxDaysOverdue > 14)
    .sort((a, b) => (b.avgDaysLate ?? 0) + b.overdue / 100 - ((a.avgDaysLate ?? 0) + a.overdue / 100))[0]
  if (slow) {
    const late = slow.avgDaysLate ?? slow.maxDaysOverdue
    out.push(
      weak({
        id: 'late-payer',
        impact: 25 + Math.min(40, late) + Math.min(30, (slow.overdue / monthlyIncome) * 30),
        title: `${slow.client.name} pays late`,
        detail: `${slow.client.name} pays ${late} days after the due date on average${
          slow.overdue > 0 ? `, and ${usd(slow.overdue)} from them is overdue right now` : ''
        }. Late money makes the rest of your plan harder: rent and tax do not wait.`,
        metric: `${late} days late`,
        action: { label: 'See invoices', href: '/demo/invoices' },
        lessonId: 'invoice-terms',
      }),
    )
  }

  // Thin cash cushion
  const liquid = liquidBalance(state, today)
  const bufferMonths = liquid / costs
  const bufferTarget = isBusiness ? 2 : 3
  if (bufferMonths < bufferTarget) {
    const fc = forecast(state, today, 6)
    const runwayNote =
      fc.runwayMonths !== null ? ` At the recent pace the balance shrinks by ${usd(-fc.monthlyNet)} a month.` : ''
    out.push(
      weak({
        id: isBusiness ? 'thin-runway' : 'low-buffer',
        impact: 10 + ((bufferTarget - bufferMonths) / bufferTarget) * 80,
        title: isBusiness ? 'Thin cash runway' : 'No real emergency buffer',
        detail: isBusiness
          ? `Cash on hand (${usd(liquid)}) covers about ${Math.round(bufferMonths * 30)} days of costs. One slow month or a broken machine would be hard to absorb.${runwayNote}`
          : `You have ${usd(liquid)} you could reach in an emergency: ${bufferMonths.toFixed(1)} months of typical spending (${usd(costs)} a month). Three months is a sensible first target.${runwayNote}`,
        metric: isBusiness ? `${Math.round(bufferMonths * 30)} days of costs` : `${bufferMonths.toFixed(1)} months`,
        action: { label: 'Set a savings goal', href: '/demo/plan' },
        lessonId: 'emergency-buffer',
      }),
    )
  }

  // Subscriptions piling up
  const subs = detectSubscriptions(state, today).filter((s) => s.active && s.categoryId !== 'software')
  if (twelve.length >= 12 && subs.length) {
    const allSubs = detectSubscriptions(state, today)
    const before = subscriptionSpendInMonth(allSubs.filter((s) => s.categoryId !== 'software'), state.transactions, twelve[0].month)
    const now = subscriptionSpendInMonth(allSubs.filter((s) => s.categoryId !== 'software'), state.transactions, twelve[11].month)
    const growth = before > 0 ? (now - before) / before : 0
    const added = subs.filter((s) => s.firstDate > `${twelve[0].month}-31`).length
    const share = now / monthlyIncome
    if ((growth >= 0.3 && added >= 3) || share >= 0.06) {
      const raised = subs.filter((s) => s.priceChange).length
      out.push(
        weak({
          id: 'subscription-creep',
          impact: 20 + Math.min(45, growth * 20) + Math.min(30, share * 400),
          title: 'Subscriptions keep piling up',
          detail: `${subs.length} subscriptions now cost ${usd(now)} a month (${usd(now * 12)} a year), up from ${usd(before)} a year ago. ${added} were added this year${
            raised ? ` and ${raised} raised ${raised === 1 ? 'its' : 'their'} price` : ''
          }.`,
          metric: `${usd(now)}/month`,
          action: { label: 'Review subscriptions', href: '/demo/insights#subscriptions' },
          lessonId: 'subscription-audit',
        }),
      )
    }
  }

  // Low savings rate (individuals)
  const income6 = six.reduce((s, m) => s + m.income, 0)
  const net6 = six.reduce((s, m) => s + m.net, 0)
  const rate = income6 > 0 ? net6 / income6 : 0
  if (!isBusiness && rate < 0.1) {
    out.push(
      weak({
        id: 'low-savings-rate',
        impact: 12 + (0.1 - rate) * 250,
        title: 'Little left at the end of the month',
        detail: `Over the last six months you kept ${pctText(rate)} of your income. Moving a fixed amount to savings on payday, before spending, is the simplest fix.`,
        metric: `${pctText(rate)} saved`,
        action: { label: 'Plan a budget', href: '/demo/plan' },
        lessonId: 'pay-yourself-first',
      }),
    )
  }

  // A cost line growing faster than income
  if (twelve.length >= 12) {
    const incomeTrend = trendOf(twelve.map((m) => m.income)).share
    const perCategory = new Map<CategoryId, number[]>()
    twelve.forEach((m, i) => {
      for (const [cat, amount] of categorySpendForMonth(state.transactions, m.month)) {
        if (cat === 'tax-payment' || cat === 'subscriptions' || cat === 'uncategorised') continue
        const arr = perCategory.get(cat) ?? new Array(12).fill(0)
        arr[i] = amount
        perCategory.set(cat, arr)
      }
    })
    let best: { cat: CategoryId; trend: number; extra: number; gap: number } | null = null
    for (const [cat, values] of perCategory) {
      const avg = values.reduce((s, v) => s + v, 0) / 12
      if (avg < costs * 0.05) continue
      const { share: trend, r2 } = trendOf(values)
      const gap = trend - incomeTrend
      const extra = avg * trend
      // Only steady climbs count, not one expensive month.
      if (r2 >= 0.5 && gap >= 0.15 && extra >= 150 && (!best || gap * extra > best.gap * best.extra)) best = { cat, trend, extra, gap }
    }
    if (best) {
      const label = getCategory(best.cat).label
      out.push(
        weak({
          id: 'cost-growth',
          impact: 25 + Math.min(40, best.gap * 100) + Math.min(30, (best.extra / monthlyIncome) * 100),
          title: `${label} rising faster than income`,
          detail: `${label} grew about ${pctText(best.trend)} over the year (roughly ${usd(best.extra)} more a month), while ${
            isBusiness ? 'sales' : 'income'
          } changed ${incomeTrend >= 0 ? '+' : ''}${pctText(incomeTrend)}. ${isBusiness ? 'Unless prices go up or costs come down, the margin keeps shrinking.' : 'Worth checking before it becomes the new normal.'}`,
          metric: `+${pctText(best.trend)} a year`,
          action: { label: 'See spending', href: `/demo/transactions?category=${best.cat}` },
          lessonId: 'cash-flow-chart',
        }),
      )
    }
  }

  // Budgets broken last month
  if (state.budgets.length) {
    const month = addMonthsToKey(monthKey(today), -1)
    const spend = categorySpendForMonth(state.transactions, month)
    const over = state.budgets
      .map((b) => ({ b, spent: spend.get(b.categoryId) ?? 0 }))
      .filter((x) => x.spent > x.b.monthlyLimit * 1.05)
    if (over.length) {
      const excess = over.reduce((s, x) => s + x.spent - x.b.monthlyLimit, 0)
      const limits = over.reduce((s, x) => s + x.b.monthlyLimit, 0)
      out.push(
        weak({
          id: 'over-budget',
          impact: 10 + Math.min(30, (excess / limits) * 100),
          title: `${over.length} budget${over.length === 1 ? '' : 's'} over the limit`,
          detail: `Last month ${over.map((x) => `${getCategory(x.b.categoryId).label.toLowerCase()} (${usd(x.spent)} of ${usd(x.b.monthlyLimit)})`).join(', ')} went over, ${usd(excess)} in total.`,
          metric: `${usd(excess)} over`,
          action: { label: 'Adjust budgets', href: '/demo/plan' },
          lessonId: 'budget-50-30-20',
        }),
      )
    }
  }

  // Depending on one client
  const clientIncome = new Map<string, number>()
  for (const inv of state.invoices) {
    if (inv.status === 'paid' && inv.paidDate && diffDays(today, inv.paidDate) <= 365) {
      const total = inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
      clientIncome.set(inv.clientId, (clientIncome.get(inv.clientId) ?? 0) + total)
    }
  }
  const yearIncome = twelve.reduce((s, m) => s + m.income, 0)
  const top = [...clientIncome.entries()].sort((a, b) => b[1] - a[1])[0]
  if (top && yearIncome > 0 && top[1] / yearIncome >= 0.5 && persona.kind === 'individual') {
    const client = state.clients.find((c) => c.id === top[0])
    out.push(
      weak({
        id: 'income-concentration',
        impact: 10 + (top[1] / yearIncome - 0.5) * 80,
        title: 'Most income from one client',
        detail: `${client?.name ?? 'One client'} paid ${pctText(top[1] / yearIncome)} of your income in the last year. Losing them would hurt.`,
        metric: pctText(top[1] / yearIncome),
        action: { label: 'See invoices', href: '/demo/invoices' },
        lessonId: 'separate-money',
      }),
    )
  }

  return out.sort((a, b) => b.impact - a.impact)
}
