import { getCategory } from './categories'
import { categorize } from './categorize'
import {
  addDays,
  addMonths,
  diffDays,
  eachDay,
  endOfMonth,
  isWeekend,
  makeISODate,
  monthKey,
  monthRange,
  startOfMonth,
  toISODate,
  weekday,
} from './dates'
import { getPersona } from './personas'
import { chance, digits, gaussian, int, pick, range, rngFor, weighted, type Rng } from './prng'
import { quarterDueDate, quarterEnd, quarterStart, taxPaymentDescription, type Quarter } from './tax-dates'
import type {
  Account,
  CategoryRule,
  DemoState,
  Goal,
  Invoice,
  InvoiceLine,
  ISODate,
  MonthKey,
  Persona,
  PersonaId,
  Transaction,
} from './types'

export const MONTHS_OF_HISTORY = 13

interface Draft {
  date: ISODate
  description: string
  amount: number
  accountId: string
  invoiceKey?: string
}

const round2 = (n: number) => Math.round(n * 100) / 100
const roundTo = (n: number, step: number) => Math.round(n / step) * step

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function monthName(month: MonthKey): string {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`
}

function mmdd(date: ISODate): string {
  return `${date.slice(5, 7)}/${date.slice(8, 10)}`
}

/** Moves weekend dates to the next Monday. */
function nextBusinessDay(date: ISODate): ISODate {
  let d = date
  while (isWeekend(d)) d = addDays(d, 1)
  return d
}

/** Moves weekend dates back to Friday (payroll convention). */
function prevBusinessDay(date: ISODate): ISODate {
  let d = date
  while (isWeekend(d)) d = addDays(d, -1)
  return d
}

function dayOf(month: MonthKey, day: number): ISODate {
  const last = Number(endOfMonth(`${month}-01`).slice(8, 10))
  return makeISODate(Number(month.slice(0, 4)), Number(month.slice(5, 7)), Math.min(day, last))
}

/** Seasonal multiplier from the calendar month, `amplitude` = ±share, peak in `peakMonth` (1–12). */
function season(date: ISODate, amplitude: number, peakMonth: number): number {
  const m = Number(date.slice(5, 7))
  return 1 + amplitude * Math.cos(((m - peakMonth) / 12) * 2 * Math.PI)
}

interface InvoicePlan {
  key: string
  clientId: string
  issueDate: ISODate
  lines: Omit<InvoiceLine, 'id'>[]
  /** Days after the due date the client actually pays; negative = early. */
  payDelay: number
  paymentDescription: string
  notes?: string
}

class Builder {
  drafts: Draft[] = []
  invoicePlans: InvoicePlan[] = []

  constructor(
    readonly persona: Persona,
    readonly start: ISODate,
    /** End of the current month: generation never depends on the exact day. */
    readonly end: ISODate,
    readonly seedKey: string,
  ) {}

  rng(stream: string): Rng {
    return rngFor(this.seedKey, stream)
  }

  get months(): MonthKey[] {
    return monthRange(monthKey(this.start), monthKey(this.end))
  }

  add(date: ISODate, description: string, amount: number, accountId = 'checking') {
    if (date < this.start || date > this.end || amount === 0) return
    this.drafts.push({ date, description, amount: round2(amount), accountId })
  }

  transfer(date: ISODate, from: Account['id'], to: Account['id'], amount: number) {
    const fromAcc = this.account(from)
    const toAcc = this.account(to)
    this.add(date, `ONLINE TRANSFER TO ${toAcc.name.toUpperCase()} XXXX${toAcc.last4}`, -amount, from)
    this.add(date, `ONLINE TRANSFER FROM ${fromAcc.name.toUpperCase()} XXXX${fromAcc.last4}`, amount, to)
  }

  account(id: string): Account {
    const acc = this.persona.accounts.find((a) => a.id === id)
    if (!acc) throw new Error(`Unknown account ${id}`)
    return acc
  }

  /** Same charge on the same day every month, optionally from month index `from` onwards. */
  monthly(
    day: number,
    describe: (r: Rng, date: ISODate) => string,
    amount: number | ((i: number, r: Rng, date: ISODate) => number),
    opts: { from?: number; until?: number; stream: string; account?: string; businessDay?: boolean },
  ) {
    const r = this.rng(opts.stream)
    this.months.forEach((m, i) => {
      if (i < (opts.from ?? 0) || i > (opts.until ?? Infinity)) return
      let date = dayOf(m, day)
      if (opts.businessDay) date = nextBusinessDay(date)
      const value = typeof amount === 'number' ? amount : amount(i, r, date)
      this.add(date, describe(r, date), -value, opts.account)
    })
  }

  /** Random spending: on each day, with probability `p`, one purchase. */
  daily(
    stream: string,
    p: (date: ISODate) => number,
    merchants: readonly (readonly [(r: Rng, date: ISODate) => string, number])[],
    amount: (r: Rng, date: ISODate) => number,
  ) {
    const r = this.rng(stream)
    for (const date of eachDay(this.start, this.end)) {
      const hit = chance(r, p(date))
      const describe = weighted(r, merchants)
      const value = amount(r, date)
      if (hit) this.add(date, describe(r, date), -value)
    }
  }

  invoice(plan: InvoicePlan) {
    this.invoicePlans.push(plan)
  }
}

// ---------------------------------------------------------------------------
// Shared spending patterns

const d4 = (r: Rng) => digits(r, 4)

function addGroceries(b: Builder, perWeek: number, basket: [number, number]) {
  b.daily(
    'groceries',
    (d) => (perWeek / 7) * (weekday(d) === 6 || weekday(d) === 0 ? 1.6 : 0.85),
    [
      [(r, d) => `PURCHASE AUTHORIZED ON ${mmdd(d)} TRADER JOE'S #${int(r, 500, 560)} SAN FRANCISCO CA`, 5],
      [(r) => `WHOLEFDS MKT #${int(r, 10200, 10299)}`, 2],
      [(r) => `SAFEWAY #${int(r, 1400, 1499)}`, 3],
      [() => `POS KIM'S MARKET`, 0.6],
    ],
    (r) => Math.max(8, gaussian(r, (basket[0] + basket[1]) / 2, (basket[1] - basket[0]) / 4)),
  )
}

function addTransport(b: Builder, ridesPerMonth: number, fare: [number, number]) {
  b.daily(
    'rides',
    (d) => (ridesPerMonth / 30) * (weekday(d) === 5 || weekday(d) === 6 ? 1.8 : 0.7),
    [
      [() => 'UBER *TRIP HELP.UBER.COM', 4],
      [() => 'LYFT *RIDE SUN 9PM', 1],
    ],
    (r) => range(r, fare[0], fare[1]),
  )
}

// ---------------------------------------------------------------------------
// Maya Chen, freelance designer

function freelancerScript(b: Builder) {
  const r = b.rng('freelancer-invoices')
  const firstIssue = addDays(b.start, -45)

  // Retainer: invoiced on the first business day of the month, paid on time.
  for (const m of monthRange(monthKey(firstIssue), monthKey(b.end))) {
    b.invoice({
      key: `lumen-${m}`,
      clientId: 'lumen',
      issueDate: nextBusinessDay(`${m}-01`),
      lines: [{ description: `Product design retainer, ${monthName(m)}`, quantity: 1, unitPrice: 2_400 }],
      payDelay: int(r, -4, 2),
      paymentDescription: `ACH CREDIT LUMEN HEALTH PAYABLES ${digits(r, 6)}`,
    })
  }

  // Northwind: project work every six weeks or so, paid weeks late.
  const phases = ['Warehouse app discovery', 'Driver app prototype', 'Dispatch dashboard', 'Usability test round', 'Design system update', 'Tracking page redesign', 'Onboarding flow', 'Reporting screens', 'Fleet map interactions', 'Accessibility fixes']
  let d = addDays(b.start, -40)
  let n = 0
  while (d <= b.end) {
    const hours = int(r, 26, 38)
    const lines: InvoicePlan['lines'] = [{ description: `${phases[n % phases.length]}, design hours`, quantity: hours, unitPrice: 110 }]
    if (chance(r, 0.4)) lines.push({ description: 'Prototype testing sessions', quantity: 1, unitPrice: 450 })
    b.invoice({
      key: `northwind-${n}`,
      clientId: 'northwind',
      issueDate: nextBusinessDay(d),
      lines,
      payDelay: int(r, 26, 46),
      paymentDescription: `ACH CREDIT NORTHWIND LOGISTI PAYMENTS ${digits(r, 6)}`,
      notes: 'Payment within 30 days of the invoice date, please.',
    })
    d = addDays(d, int(r, 38, 50))
    n++
  }

  // Pollen: small illustration jobs.
  d = addDays(b.start, int(r, 8, 20))
  n = 0
  while (d <= b.end) {
    b.invoice({
      key: `pollen-${n}`,
      clientId: 'pollen',
      issueDate: nextBusinessDay(d),
      lines: [{ description: pick(r, ['Brand illustration set', 'Packaging artwork', 'Social media templates', 'Pitch deck design']), quantity: int(r, 8, 16), unitPrice: 95 }],
      payDelay: int(r, -3, 3),
      paymentDescription: `ACH CREDIT POLLEN STUDIO ${digits(r, 6)}`,
    })
    d = addDays(d, int(r, 52, 78))
    n++
  }

  // Kestrel: two larger app projects.
  for (const [i, offset] of [int(r, 40, 60), int(r, 215, 240)].entries()) {
    b.invoice({
      key: `kestrel-${i}`,
      clientId: 'kestrel',
      issueDate: nextBusinessDay(addDays(b.start, offset)),
      lines: [
        { description: i === 0 ? 'Mobile app redesign, discovery' : 'Subscription flow, research', quantity: 1, unitPrice: 2_200 },
        { description: 'High-fidelity screens', quantity: int(r, 22, 30), unitPrice: 120 },
      ],
      payDelay: int(r, 0, 6),
      paymentDescription: `ACH CREDIT KESTREL APPS ${digits(r, 6)}`,
    })
  }

  // Fernway: two website jobs.
  for (const [i, offset] of [int(r, 110, 130), int(r, 290, 310)].entries()) {
    b.invoice({
      key: `fernway-${i}`,
      clientId: 'fernway',
      issueDate: nextBusinessDay(addDays(b.start, offset)),
      lines: [{ description: i === 0 ? 'Website refresh' : 'Book launch landing page', quantity: 1, unitPrice: roundTo(range(r, 1_050, 1_450), 50) }],
      payDelay: int(r, 0, 5),
      paymentDescription: `ACH CREDIT FERNWAY BOOKS ${digits(r, 6)}`,
    })
  }

  // Fixed monthly costs
  b.monthly(1, () => 'ACH DEBIT PARKVIEW PROP MGMT RENT', 2_150, { stream: 'rent' })
  b.monthly(1, (x) => `OSCAR HEALTH PREMIUM ${digits(x, 6)}`, 412, { stream: 'health' })
  b.monthly(2, (x) => `WEWORK MEMBERSHIP ${d4(x)}`, 350, { stream: 'cowork' })
  b.monthly(3, () => 'GOOGLE *GSUITE_MAYACHEN', 14, { stream: 'gsuite' })
  b.monthly(5, () => 'NOTION LABS INC', 10, { stream: 'notion' })
  b.monthly(7, () => 'FIGMA MONTHLY', 15, { stream: 'figma' })
  b.monthly(9, () => 'COMCAST XFINITY INTERNET', 70, { stream: 'internet' })
  b.monthly(12, () => 'WEBFLOW.COM', 29, { stream: 'webflow' })
  b.monthly(14, () => 'ADOBE *CREATIVE CLOUD', 59.99, { stream: 'adobe' })
  b.monthly(17, () => 'SPOTIFY USA', 11.99, { stream: 'spotify' })
  b.monthly(18, (x, dt) => `PG&E WEB ONLINE ${dt.replace(/-/g, '').slice(2)}`, (_, x, dt) => 72 * season(dt, 0.3, 1) * range(x, 0.85, 1.2), { stream: 'power' })
  b.monthly(20, () => 'DROPBOX*PLUS', 11.99, { stream: 'dropbox' })
  b.monthly(22, () => 'T-MOBILE POSTPAID', 65, { stream: 'phone' })
  b.monthly(24, () => 'NETFLIX.COM', (i) => (i < 6 ? 15.49 : 17.99), { stream: 'netflix' })
  b.monthly(26, () => 'CLASSPASS*MONTHLY', 49, { stream: 'classpass' })
  b.monthly(27, () => 'APPLE.COM/BILL 866-712-7753', 2.99, { stream: 'icloud' })
  b.monthly(15, (x) => `BRIGHTLINE BOOKKEEPING ${d4(x)}`, 150, { stream: 'bookkeeping', from: 1 })

  // Paying herself first: a fixed amount to savings.
  for (const m of b.months) b.transfer(nextBusinessDay(`${m}-03`), 'checking', 'savings', 400)

  // One-off purchases
  const o = b.rng('freelancer-oneoff')
  b.add(addDays(b.start, int(o, 70, 90)), 'B&H PHOTO 800-606-6969 NY', -699)
  b.add(addDays(b.start, int(o, 230, 250)), 'B&H PHOTO 800-606-6969 NY', -2_399)
  b.add(addDays(b.start, int(o, 120, 140)), '1PASSWORD.COM ANNUAL', -35.88)
  const trip = addDays(b.start, int(o, 250, 275))
  b.add(trip, `DELTA AIR 0062${digits(o, 7)}`, -386.4)
  b.add(addDays(trip, 2), 'AIRBNB * HMQ4K2ZPX', -642.18)
  const holiday = makeISODate(Number(b.start.slice(0, 4)), 12, int(o, 12, 18))
  b.add(holiday, `UNITED AIRLINES ${digits(o, 10)}`, -418.9)
  b.add(addDays(holiday, 3), `ETSY.COM*GIFTS ${d4(o)}`, -126.5)
  b.add(addDays(holiday, 5), `AMZN MKTP US*${digits(o, 9)}`, -214.33)

  addGroceries(b, 2.2, [35, 95])
  addTransport(b, 4, [11, 34])
  b.daily(
    'coffee',
    (dt) => (isWeekend(dt) ? 0.35 : 0.6),
    [
      [(x) => `SQ *BLUE BOTTLE ${d4(x)}`, 5],
      [(x) => `STARBUCKS STORE ${digits(x, 5)}`, 3],
      [(x) => `SQ *SIGHTGLASS COFFEE ${d4(x)}`, 0.35],
    ],
    (x) => range(x, 4.5, 7.8),
  )
  b.daily(
    'restaurants',
    (dt) => (weekday(dt) >= 4 ? 0.3 : 0.12),
    [
      [() => 'TST* LA TAQUERIA SF', 2],
      [(x) => `SWEETGREEN ${d4(x)}`, 3],
      [(x) => `CHIPOTLE ${d4(x)}`, 2],
      [() => 'DOORDASH*THAI GARDEN', 2],
      [() => 'UBER *EATS PENDING', 1],
    ],
    (x) => Math.max(11, gaussian(x, 34, 12)),
  )
  b.daily(
    'shopping',
    () => 0.09,
    [
      [(x) => `AMZN MKTP US*${digits(x, 9)}`, 6],
      [(x) => `TARGET T-${d4(x)}`, 2],
      [(x) => `UNIQLO USA ${d4(x)}`, 1],
    ],
    (x) => Math.max(9, gaussian(x, 58, 30)),
  )
  b.daily('clipper', () => 0.05, [[() => 'CLIPPER SERVICE CENTER', 1]], (x) => pick(x, [20, 30, 40]))
}

// ---------------------------------------------------------------------------
// Daniel Okafor, first job

function starterScript(b: Builder) {
  // Salary: twice a month, a raise mid-year.
  b.months.forEach((m, i) => {
    const pay = i < 7 ? 1_742.36 : 1_811.92
    b.add(prevBusinessDay(dayOf(m, 15)), `BRIGHTPATH ANALYTI PAYROLL PPD ID ${digits(b.rng(`pay-${m}`), 10)}`, pay)
    b.add(prevBusinessDay(endOfMonth(`${m}-01`)), `BRIGHTPATH ANALYTI PAYROLL PPD ID ${digits(b.rng(`pay2-${m}`), 10)}`, pay)
  })

  // Side gig: small Upwork jobs plus invoices to one local client.
  const g = b.rng('upwork')
  for (const date of eachDay(b.start, b.end)) {
    if (chance(g, 1.1 / 30)) b.add(date, 'UPWORK ESCROW INC WITHDRAWAL', roundTo(range(g, 90, 420), 5))
  }
  const h = b.rng('hearth')
  for (const [i, offset] of [int(h, 60, 80), int(h, 180, 200), int(h, 330, 345)].entries()) {
    b.invoice({
      key: `hearth-${i}`,
      clientId: 'hearth',
      issueDate: nextBusinessDay(addDays(b.start, offset)),
      lines: [
        { description: ['Online ordering page', 'Sales dashboard', 'Menu and price updates'][i], quantity: int(h, 6, 12), unitPrice: 45 },
      ],
      payDelay: int(h, -2, 4),
      paymentDescription: `ACH CREDIT HEARTH CRUMB BAKERY ${digits(h, 6)}`,
    })
  }

  b.monthly(1, () => 'ACH DEBIT MAPLE COURT APTS RENT', 1_450, { stream: 'rent' })
  b.monthly(8, (x) => `NELNET STUDENT LN ${digits(x, 8)}`, 265, { stream: 'loan' })
  b.monthly(11, () => 'MINT MOBILE', 30, { stream: 'phone' })
  b.monthly(3, () => 'CLIPPER MONTHLY PASS', 86, { stream: 'transit' })
  b.monthly(19, (x) => `VENMO *PAYMENT ALEX R ${d4(x)}`, (_, x) => roundTo(range(x, 70, 110), 1), { stream: 'roommate' })
  b.monthly(23, () => 'LEMONADE INS RENTERS', 14, { stream: 'renters' })
  b.monthly(12, (x) => `TST* FADE STUDIO BARBER ${d4(x)}`, 35, { stream: 'barber' })
  b.monthly(26, (x) => `AFFIRM *PAYMENT ${digits(x, 8)}`, 58.25, { stream: 'affirm', from: 2, until: 13 })
  // A used car: insurance plus fuel.
  b.monthly(4, (x) => `GEICO *AUTO ${digits(x, 8)}`, 118.4, { stream: 'car-insurance' })
  b.daily('fuel', (dt) => (weekday(dt) === 6 ? 0.45 : 0.03), [[(x, dt) => `CHECKCARD ${mmdd(dt)} SHELL OIL ${digits(x, 11)}`, 1]], (x) => range(x, 30, 52))

  // Subscriptions keep piling up.
  const subs: [number, number, string, number | ((i: number) => number)][] = [
    [0, 4, 'SPOTIFY USA', (i) => (i < 6 ? 11.99 : 12.99)],
    [0, 9, 'NETFLIX.COM', (i) => (i < 4 ? 15.49 : 17.99)],
    [0, 27, 'APPLE.COM/BILL 866-712-7753', 2.99],
    [0, 2, 'PLANET FITNESS CLUB FEES', 24.99],
    [2, 14, 'HULU 877-8244858', 7.99],
    [3, 21, 'MICROSOFT*XBOX GAME PASS', 16.99],
    [5, 6, 'DISNEYPLUS 888-905-7888', 13.99],
    [6, 17, 'AUDIBLE*MEMBERSHIP', 14.95],
    [7, 25, 'HBO MAX HBOMAX.COM', 16.99],
    [8, 10, 'PELOTON* APP MEMBERSHIP', 12.99],
    [9, 13, 'HEADSPACE INC', 12.99],
    [10, 5, 'GOOGLE *YOUTUBEPREMIUM', 13.99],
    [11, 28, 'AMAZON PRIME*MEMBERSHIP', 14.99],
  ]
  subs.forEach(([from, day, description, amount]) => {
    b.monthly(day, () => description, typeof amount === 'number' ? amount : (i) => amount(i), { stream: `sub-${description}`, from })
  })
  const a = b.rng('annual')
  b.add(addDays(b.start, int(a, 100, 120)), 'STRAVA *ANNUAL', -79.99)
  b.add(addDays(b.start, int(a, 300, 320)), 'DUOLINGO *PLUS ANNUAL', -84.99)

  // Trying to save: a transfer after each payday that sometimes gets pulled back.
  for (const m of b.months) b.transfer(dayOf(m, 16), 'checking', 'savings', 100)

  b.monthly(18, (x, dt) => `PG&E WEB ONLINE ${dt.replace(/-/g, '').slice(2)}`, (_, x) => range(x, 38, 72), { stream: 'power' })

  addGroceries(b, 1.4, [28, 85])
  addTransport(b, 3, [9, 28])
  b.daily(
    'delivery',
    (dt) => (weekday(dt) >= 4 || weekday(dt) === 0 ? 0.62 : 0.34),
    [
      [() => 'DOORDASH*DASHPASS ORDER', 4],
      [() => 'UBER *EATS PENDING', 3],
      [(x) => `GRUBHUB*SEOULBOWL ${d4(x)}`, 1],
      [(x) => `CHIPOTLE ${d4(x)}`, 2],
      [() => 'TST* SLICE HOUSE PIZZA', 1],
    ],
    (x) => Math.max(10, gaussian(x, 31, 10)),
  )
  b.daily(
    'coffee',
    (dt) => (isWeekend(dt) ? 0.3 : 0.7),
    [[(x) => `STARBUCKS STORE ${digits(x, 5)}`, 1]],
    (x) => range(x, 4.2, 7.5),
  )
  b.daily(
    'shopping',
    () => 0.19,
    [
      [(x) => `AMZN MKTP US*${digits(x, 9)}`, 6],
      [(x) => `TARGET T-${d4(x)}`, 2],
      [(x) => `UNIQLO USA ${d4(x)}`, 1],
      [(x) => `SEPHORA ${digits(x, 5)}`, 1],
      [() => 'PAYPAL *STEAMGAMES', 0.6],
    ],
    (x) => Math.max(8, gaussian(x, 47, 24)),
  )
  b.daily(
    'fun',
    (dt) => (weekday(dt) >= 5 ? 0.14 : 0.03),
    [
      [(x) => `AMC ${d4(x)} ONLINE`, 2],
      [() => 'TICKETMASTER', 1],
      [(x) => `EVENTBRITE/${digits(x, 9)}`, 1],
    ],
    (x) => Math.max(12, gaussian(x, 38, 15)),
  )
  const o = b.rng('starter-oneoff')
  b.add(addDays(b.start, int(o, 40, 60)), `BEST BUY ${digits(o, 8)}`, -349.99)
  const trip = addDays(b.start, int(o, 260, 280))
  b.add(trip, `EXPEDIA ${digits(o, 12)}`, -486.2)
  const holiday = makeISODate(Number(b.start.slice(0, 4)), 12, int(o, 10, 19))
  b.add(holiday, `AMZN MKTP US*${digits(o, 9)}`, -168.4)
  b.add(addDays(holiday, 2), `TARGET T-${d4(o)}`, -94.12)
  b.add(addDays(b.start, int(o, 150, 170)), 'COURSERA.ORG', -49)
}

// ---------------------------------------------------------------------------
// Brew & Bloom, coffee kiosk

function businessScript(b: Builder) {
  const r = b.rng('sales')
  // Card sales settle the next morning in one batch. Closed on Mondays.
  for (const date of eachDay(b.start, b.end)) {
    const wd = weekday(date)
    if (wd === 1) continue
    const monthsIn = diffDays(date, b.start) / 30.4
    const growth = 1 + 0.002 * monthsIn
    const dayFactor = wd === 6 || wd === 0 ? 1.35 : 0.9
    const amount = 405 * dayFactor * season(date, 0.05, 7) * growth * range(r, 0.82, 1.18)
    b.add(addDays(date, 1), `SQUARE INC DEPOSIT ${date.replace(/-/g, '').slice(2)} L${digits(r, 6)}`, roundTo(amount, 0.01))
  }
  // Weekly cash deposit.
  for (const date of eachDay(b.start, b.end)) {
    if (weekday(date) === 2) b.add(date, `BRANCH CASH DEPOSIT ${digits(r, 6)}`, roundTo(range(r, 260, 470), 5))
  }

  // Supplier costs drift up faster than sales.
  const s = b.rng('suppliers')
  // Deliveries on fixed days of the month; suppliers raise prices a little every month.
  const supplier = (days: number[], base: number, monthlyGrowth: number, describe: () => string) => {
    b.months.forEach((m, i) => {
      for (const day of days) {
        const date = dayOf(m, day)
        const amount = base * Math.pow(1 + monthlyGrowth, i) * season(date, 0.03, 7) * range(s, 0.93, 1.07)
        b.add(date, describe(), -roundTo(amount, 0.01))
      }
    })
  }
  supplier([2, 9, 16, 23], 440, 0.026, () => `ROASTWORKS COFFEE CO #${int(s, 2200, 2299)}`)
  supplier([3, 10, 17, 24], 240, 0.022, () => `VALLEY DAIRY SUPPLY INV ${digits(s, 5)}`)
  supplier([4, 11, 18, 25], 270, 0.018, () => `SUNRISE BAKERY WHOLESALE`)
  supplier([6, 20], 215, 0.024, () => `ECOPACK SUPPLIES ${digits(s, 6)}`)

  // Catering invoices.
  b.months.forEach((m, i) => {
    b.invoice({
      key: `harbor-${m}`,
      clientId: 'harbor',
      issueDate: nextBusinessDay(dayOf(m, 28)),
      lines: [
        { description: `Office coffee service, ${monthName(m)}`, quantity: int(s, 18, 22), unitPrice: 32 },
        { description: 'Pastry trays', quantity: int(s, 3, 6), unitPrice: 45 },
      ],
      payDelay: int(s, -3, 2),
      paymentDescription: `ACH CREDIT HARBOR COWORKING ${digits(s, 6)}`,
    })
    if (i === 3 || i === 7 || i === 11) {
      b.invoice({
        key: `linden-${i}`,
        clientId: 'linden',
        issueDate: nextBusinessDay(dayOf(m, 12)),
        lines: [{ description: 'Coffee cart for evening event', quantity: 1, unitPrice: roundTo(range(s, 320, 520), 10) }],
        payDelay: int(s, 0, 8),
        paymentDescription: `ACH CREDIT LINDEN ST LIBRARY ${digits(s, 6)}`,
      })
    }
  })

  // Payroll on the 15th and the last business day, via a payroll service.
  for (const m of b.months) {
    b.add(prevBusinessDay(dayOf(m, 15)), `GUSTO PAY ${digits(r, 6)} BREW BLOOM`, -2_350)
    b.add(prevBusinessDay(endOfMonth(`${m}-01`)), `GUSTO PAY ${digits(r, 6)} BREW BLOOM`, -2_350)
    b.add(prevBusinessDay(endOfMonth(`${m}-01`)), `GUSTO TAX ${digits(r, 6)} BREW BLOOM`, -340)
  }

  b.monthly(1, () => 'ACH DEBIT MARKET HALL LEASE', 1_650, { stream: 'lease' })
  b.monthly(5, (x) => `PACIFIC EQUIP FINANCE PMT ${digits(x, 6)}`, 585, { stream: 'loan' })
  b.monthly(6, () => 'NEXT INSURANCE', 96, { stream: 'insurance' })
  b.monthly(9, () => 'INTUIT *QBOOKS ONLINE', 35, { stream: 'qbo' })
  b.monthly(3, () => 'GOOGLE *GSUITE_BREWBLOOM', 7.2, { stream: 'gsuite' })
  b.monthly(16, (x) => `CITY POWER & LIGHT ELECTRIC ${digits(x, 8)}`, (_, x) => range(x, 180, 250), { stream: 'power' })
  b.monthly(20, () => 'T-MOBILE POSTPAID', 55, { stream: 'phone' })
  b.monthly(28, () => 'MONTHLY SERVICE FEE', 15, { stream: 'fees' })
  b.monthly(21, (x) => `FACEBK *${digits(x, 9)}`, (_, x) => roundTo(range(x, 40, 120), 0.01), { stream: 'ads' })
  b.monthly(10, (x) => `CEDAR CPA GROUP ${d4(x)}`, 240, { stream: 'cpa' })

  const o = b.rng('business-oneoff')
  for (let i = 0; i < 6; i++) b.add(addDays(b.start, int(o, 0, 390)), `WEBSTAURANT STORE ${digits(o, 8)}`, -roundTo(range(o, 70, 380), 0.01))
  b.add(addDays(b.start, int(o, 60, 80)), 'CITY OF OAKVIEW BUSINESS LIC', -420)
  b.add(addDays(b.start, int(o, 150, 175)), `VISTAPRINT ${digits(o, 9)}`, -138.4)
  b.add(addDays(b.start, int(o, 200, 230)), `SQ *RIVERSIDE POP UP ${d4(o)}`, -180)
  b.add(addDays(b.start, int(o, 30, 50)), `WEBSTAURANT STORE ${digits(o, 8)}`, -1_240)
  b.add(addDays(b.start, int(o, 90, 110)), `VENMO *PAYMENT JOSE M PLUMBING`, -165)
  b.add(addDays(b.start, int(o, 330, 360)), `VENMO *PAYMENT JOSE M PLUMBING`, -140)
}

const SCRIPTS: Record<PersonaId, (b: Builder) => void> = {
  freelancer: freelancerScript,
  starter: starterScript,
  business: businessScript,
}

// How each persona deals with estimated tax.
const TAX_HABITS: Record<PersonaId, { payShare: number; fromAccount: string; skipRecentDays: number; setAsideRate: number }> = {
  freelancer: { payShare: 0.55, fromAccount: 'tax', skipRecentDays: 75, setAsideRate: 0.08 },
  starter: { payShare: 0, fromAccount: 'checking', skipRecentDays: 0, setAsideRate: 0 },
  business: { payShare: 1, fromAccount: 'checking', skipRecentDays: 0, setAsideRate: 0 },
}

// ---------------------------------------------------------------------------

function buildInvoices(b: Builder, today: ISODate, persona: Persona, startNumber: number) {
  const plans = [...b.invoicePlans]
    .filter((p) => p.issueDate <= today)
    .sort((x, y) => (x.issueDate === y.issueDate ? x.key.localeCompare(y.key) : x.issueDate.localeCompare(y.issueDate)))

  const invoices: (Invoice & { key: string })[] = []
  let number = startNumber
  for (const plan of plans) {
    const client = persona.clients.find((c) => c.id === plan.clientId)!
    const dueDate = addDays(plan.issueDate, client.termsDays)
    const payDate = nextBusinessDay(addDays(dueDate, plan.payDelay))
    const paid = payDate <= today
    if (paid && payDate < b.start) continue
    const lines = plan.lines.map((l, i) => ({ ...l, id: `line-${i + 1}` }))
    const total = round2(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0))
    const invoice: Invoice & { key: string } = {
      key: plan.key,
      id: `inv-${number}`,
      number: formatInvoiceNumber(number),
      clientId: plan.clientId,
      issueDate: plan.issueDate,
      dueDate,
      lines,
      notes: plan.notes,
      status: paid ? 'paid' : 'sent',
      sentDate: plan.issueDate,
      paidDate: paid ? payDate : undefined,
    }
    invoices.push(invoice)
    number++
    if (paid) {
      b.drafts.push({ date: payDate, description: plan.paymentDescription, amount: total, accountId: 'checking', invoiceKey: plan.key })
    }
  }
  return { invoices, nextNumber: number }
}

export function formatInvoiceNumber(n: number): string {
  return `INV-${String(n).padStart(3, '0')}`
}

function addTaxSetAside(b: Builder, rate: number) {
  if (rate <= 0) return
  for (const d of [...b.drafts]) {
    if (d.invoiceKey && d.amount > 0) b.transfer(d.date, 'checking', 'tax', roundTo(d.amount * rate, 10))
  }
}

function addTaxPayments(b: Builder, persona: Persona, today: ISODate, rules: readonly CategoryRule[]) {
  const habit = TAX_HABITS[persona.id]
  if (habit.payShare <= 0) return
  const firstYear = Number(b.start.slice(0, 4)) - 1
  const lastYear = Number(today.slice(0, 4))
  for (let year = firstYear; year <= lastYear; year++) {
    for (const q of [1, 2, 3, 4] as Quarter[]) {
      const due = quarterDueDate(year, q)
      if (due < b.start || due > today) continue
      if (habit.skipRecentDays > 0 && diffDays(today, due) < habit.skipRecentDays) continue
      // Profit in the quarter, from what is already in the data (or an average when the quarter predates it).
      const from = quarterStart(year, q)
      const to = quarterEnd(year, q)
      let profit = 0
      let covered = 0
      for (const d of b.drafts) {
        if (d.date < from || d.date > to) continue
        const cat = getCategory(categorize(d.description, d.amount, rules).categoryId)
        if (cat.kind === 'income' && cat.taxableByDefault) profit += d.amount
        if (cat.kind === 'expense' && cat.deductibleByDefault) profit += d.amount
        covered++
      }
      if (covered === 0) continue
      const coveredDays = diffDays(to, from < b.start ? b.start : from) + 1
      const scale = (diffDays(to, from) + 1) / Math.max(1, coveredDays)
      let amount = roundTo(Math.max(0, profit * Math.min(scale, 3)) * persona.taxSettings.rate * habit.payShare, 100)
      const payDate = prevBusinessDay(addDays(due, -1))
      const available = balanceOn(b, habit.fromAccount, payDate)
      if (habit.fromAccount !== 'checking') amount = Math.min(amount, roundTo(available - 50, 100))
      if (amount >= 100) b.add(payDate, taxPaymentDescription(year, q), -amount, habit.fromAccount)
    }
  }
}

function balanceOn(b: Builder, accountId: string, date: ISODate): number {
  const opening = b.account(accountId).openingBalance
  return b.drafts.reduce((s, d) => (d.accountId === accountId && d.date <= date ? s + d.amount : s), opening)
}

/** Moves money from savings when the everyday account would dip below a floor, like overdraft protection. */
function addOverdraftTransfers(b: Builder, floor: number) {
  const savings = b.persona.accounts.find((a) => a.purpose === 'savings')
  if (!savings) return
  const sorted = [...b.drafts].sort((x, y) => x.date.localeCompare(y.date))
  let checking = b.account('checking').openingBalance
  let saved = savings.openingBalance
  let i = 0
  while (i < sorted.length) {
    const date = sorted[i].date
    while (i < sorted.length && sorted[i].date === date) {
      const d = sorted[i]
      if (d.accountId === 'checking') checking += d.amount
      if (d.accountId === savings.id) saved += d.amount
      i++
    }
    if (checking < floor && saved > 100) {
      const amount = Math.min(roundTo(floor - checking + 250, 50), Math.floor(saved / 50) * 50)
      if (amount > 0) {
        b.add(date, `ONLINE TRANSFER FROM ${savings.name.toUpperCase()} XXXX${savings.last4}`, amount, 'checking')
        b.add(date, `ONLINE TRANSFER TO ${b.account('checking').name.toUpperCase()} XXXX${b.account('checking').last4}`, -amount, savings.id)
        checking += amount
        saved -= amount
      }
    }
  }
}

const INVOICE_START: Record<PersonaId, number> = { freelancer: 31, starter: 1, business: 101 }

/** First day of the generated window: the first of the month, 12 months before today's month. */
export function windowStart(today: ISODate): ISODate {
  return startOfMonth(addMonths(startOfMonth(today), -(MONTHS_OF_HISTORY - 1)))
}

/**
 * Builds a full demo state for a persona: 13 calendar months of bank transactions ending
 * `today`, invoices, budgets, goals and tax settings. Deterministic for a persona and a
 * calendar month; every transaction goes through the categoriser.
 */
export function generateState(personaId: PersonaId, today: Date | ISODate = new Date()): DemoState {
  const todayIso = typeof today === 'string' ? today : toISODate(today)
  const persona = getPersona(personaId)
  const start = windowStart(todayIso)
  const end = endOfMonth(todayIso)
  const b = new Builder(persona, start, end, `${personaId}:${monthKey(todayIso)}`)

  SCRIPTS[personaId](b)
  const { invoices, nextNumber } = buildInvoices(b, todayIso, persona, INVOICE_START[personaId])
  addTaxSetAside(b, TAX_HABITS[personaId].setAsideRate)
  addTaxPayments(b, persona, todayIso, persona.rules)
  addOverdraftTransfers(b, personaId === 'business' ? 1_500 : 150)

  const drafts = b.drafts
    .filter((d) => d.date <= todayIso)
    .map((d, order) => ({ d, order }))
    .sort((x, y) => (x.d.date === y.d.date ? x.order - y.order : x.d.date.localeCompare(y.d.date)))

  const prefix = personaId[0]
  const invoiceTx = new Map<string, string>()
  const transactions: Transaction[] = drafts.map(({ d }, i) => {
    const id = `${prefix}-${String(i + 1).padStart(4, '0')}`
    const result = categorize(d.description, d.amount, persona.rules)
    const invoice = d.invoiceKey ? invoices.find((inv) => inv.key === d.invoiceKey) : undefined
    if (invoice) invoiceTx.set(invoice.id, id)
    return {
      id,
      date: d.date,
      description: d.description,
      merchant: result.merchant,
      amount: d.amount,
      accountId: d.accountId,
      categoryId: result.categoryId,
      confidence: result.confidence,
      reason: result.reason,
      source: 'bank',
      reviewed: false,
      invoiceId: invoice?.id,
    }
  })
  transactions.reverse()

  // A draft invoice the user has started but not sent.
  const finalInvoices: Invoice[] = invoices.map((inv) => {
    const copy: Invoice & { key?: string } = { ...inv, transactionId: invoiceTx.get(inv.id) }
    delete copy.key
    return copy
  })
  const draftClient = persona.clients[persona.clients.length > 2 ? 2 : 0]
  finalInvoices.push({
    id: `inv-${nextNumber}`,
    number: formatInvoiceNumber(nextNumber),
    clientId: draftClient.id,
    issueDate: todayIso,
    dueDate: addDays(todayIso, draftClient.termsDays),
    lines: [{ id: 'line-1', description: personaId === 'business' ? 'Coffee cart for staff party' : 'Design review session', quantity: personaId === 'business' ? 1 : 4, unitPrice: personaId === 'business' ? 480 : 95 }],
    status: 'draft',
  })

  // Opening balances are whatever the account held when the window starts; make sure that was
  // enough for the account never to close a day overdrawn.
  const accounts: Account[] = persona.accounts.map((a) => {
    let running = a.openingBalance
    let lowest = running
    const own = transactions.filter((t) => t.accountId === a.id)
    for (let i = own.length - 1; i >= 0; i--) {
      running += own[i].amount
      if (i === 0 || own[i - 1].date !== own[i].date) lowest = Math.min(lowest, running)
    }
    const topUp = lowest < 50 ? Math.ceil((50 - lowest) / 50) * 50 : 0
    return { ...a, openingBalance: a.openingBalance + topUp, openingDate: start }
  })
  const balances = new Map(accounts.map((a) => [a.id, a.openingBalance]))
  for (const t of transactions) balances.set(t.accountId, round2((balances.get(t.accountId) ?? 0) + t.amount))

  const goals: Goal[] = persona.goals.map((g, i) => ({
    ...g,
    saved: g.accountId ? Math.max(0, balances.get(g.accountId) ?? 0) : g.saved,
    targetDate: g.targetDate || endOfMonth(addMonths(todayIso, i === 0 ? 18 : 7)),
  }))

  return {
    version: 1,
    personaId,
    generatedOn: todayIso,
    accounts,
    transactions,
    clients: persona.clients.map((c) => ({ ...c })),
    invoices: finalInvoices.sort((x, y) => y.issueDate.localeCompare(x.issueDate) || y.number.localeCompare(x.number)),
    budgets: persona.budgets.map((x) => ({ ...x })),
    goals,
    rules: persona.rules.map((x) => ({ ...x })),
    taxSettings: { ...persona.taxSettings },
    period: 'last-3-months',
    completedLessons: [],
    edited: false,
    seq: 1,
  }
}

