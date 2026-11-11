import { categorySpendForMonth, liquidBalance, monthlySeries } from './analytics'
import { getCategory } from './categories'
import { addMonthsToKey, monthKey } from './dates'
import { money, moneyCompact, pct } from './format'
import { detectSubscriptions } from './insights'
import { clientStats, receivablesSummary } from './invoices'
import { getPersona } from './personas'
import { estimateTax, taxOn } from './tax'
import type { DemoState, ISODate } from './types'

export interface Lesson {
  id: string
  title: string
  /** One line for cards and lists. */
  summary: string
  minutes: number
  /** Short paragraphs, plain language. */
  body: string[]
  /** The one thing to remember. */
  takeaway: string
  /** Where in the demo to try it. */
  tryIt: { label: string; href: string }
  /** One sentence with the user's own numbers. */
  personalise: (state: DemoState, today: ISODate) => string
}

const lastMonths = (state: DemoState, today: ISODate, n: number) => monthlySeries(state.transactions, today, n + 1).slice(0, n)

const avgIncome = (state: DemoState, today: ISODate, n = 3) => {
  const months = lastMonths(state, today, n)
  return months.reduce((s, m) => s + m.income, 0) / (months.length || 1)
}

const avgCosts = (state: DemoState, today: ISODate, n = 3) => {
  const months = lastMonths(state, today, n)
  return months.reduce((s, m) => s + m.expenses, 0) / (months.length || 1)
}

export const LESSONS: Lesson[] = [
  {
    id: 'pay-yourself-first',
    title: 'Pay yourself first',
    summary: 'Save at the start of the month, not with whatever is left at the end.',
    minutes: 2,
    body: [
      'Most people try to save what is left at the end of the month. The trouble is that spending expands to fill whatever is in the account, so "what is left" is usually close to nothing.',
      'Paying yourself first flips the order. The day money arrives, a fixed amount moves to a separate savings account before you pay for anything else. You then live on the rest, the same way you would if your income were a little lower.',
      'Start small enough that you will not undo it. Even 5% is a habit; you can raise it each time your income goes up. An automatic transfer on payday works better than willpower because you never have to decide again.',
      'Keep the savings account somewhere slightly inconvenient: a different bank, no card attached. Friction protects it from impulse spending.',
    ],
    takeaway: 'Move a fixed amount to savings on payday, automatically, before spending anything.',
    tryIt: { label: 'Create a savings goal', href: '/demo/plan' },
    personalise: (state, today) => {
      const income = avgIncome(state, today)
      if (income <= 0) return 'Once income starts arriving, try moving 10% of each payment to savings the same day.'
      const tenth = income * 0.1
      return `Your income averaged ${money(income, { whole: true })} a month recently. Moving 10% (${money(tenth, { whole: true })}) on the day it arrives would build ${money(tenth * 12, { whole: true })} in a year.`
    },
  },
  {
    id: 'tax-set-aside',
    title: 'Setting aside tax on irregular income',
    summary: 'When nobody withholds tax for you, a fixed share of every payment is not yours to spend.',
    minutes: 2,
    body: [
      'An employer usually takes tax out of a salary before it reaches you. Freelance, side-gig and business income arrives whole, which makes it feel bigger than it is. Part of it belongs to the tax office; you are only holding it.',
      'The simple fix is a percentage rule. Every time money comes in, move a fixed share to a separate "tax reserve" account the same day. You then pay the tax bill from that account, not from whatever you have left.',
      'Which percentage? Roughly your expected tax divided by your income. Because costs reduce taxable profit, the right share is usually a little below the headline tax rate, but round it up: being slightly over is a nice surprise, being under is a stressful one.',
      'Many tax systems ask for payments during the year (for example quarterly) rather than one bill at the end. Missing those can add penalties, so put the due dates in your calendar.',
    ],
    takeaway: 'Move a fixed share of every payment to a tax reserve the day it arrives.',
    tryIt: { label: 'Open the tax planner', href: '/demo/tax' },
    personalise: (state, today) => {
      const tax = estimateTax(state, Number(today.slice(0, 4)), today)
      if (tax.taxableIncome <= 0) return 'You have no taxable income this year so far, so there is nothing to set aside yet.'
      const reserve = state.accounts.some((a) => a.purpose === 'tax')
      return reserve
        ? `Your profit needs about ${pct(tax.suggestedSetAsideRate)} set aside; over the last year you moved ${pct(tax.currentSetAsideRate)} into your tax reserve.`
        : `About ${pct(tax.suggestedSetAsideRate)} of your ${money(tax.taxableIncome, { whole: true })} taxable income this year should be set aside: roughly ${money(tax.estimatedTax, { whole: true })} so far.`
    },
  },
  {
    id: 'emergency-buffer',
    title: 'Your emergency buffer',
    summary: 'Cash for the surprises that are certain to happen, just not when.',
    minutes: 2,
    body: [
      'A broken phone, a dentist bill, a quiet month at work: none of these are rare, only unpredictable. An emergency buffer is money set aside so that a surprise is an inconvenience instead of a debt.',
      'Measure it in months, not dollars: how many months of your usual spending could you cover with money you can reach quickly? One month is a start, three is solid for most employees, and six or more makes sense if your income is irregular or you run a business.',
      'Keep it in a plain savings account, separate from everyday money, not invested in anything that can fall in value right when you need it.',
      'Build it before you start paying off cheap debt early or investing. Without a buffer, the next surprise goes on a credit card and undoes the progress.',
    ],
    takeaway: 'Aim for three months of spending in easy-to-reach savings; six with irregular income.',
    tryIt: { label: 'Set a buffer goal', href: '/demo/plan' },
    personalise: (state, today) => {
      const costs = avgCosts(state, today)
      const liquid = liquidBalance(state, today)
      if (costs <= 0) return 'Add a few months of spending to see how long your savings would last.'
      return `You have ${money(liquid, { whole: true })} available, which covers ${(liquid / costs).toFixed(1)} months of your usual ${money(costs, { whole: true })} a month.`
    },
  },
  {
    id: 'budget-50-30-20',
    title: '50/30/20: a starting point for a budget',
    summary: 'Needs, wants and savings: a rough split to compare yourself against.',
    minutes: 2,
    body: [
      'A budget does not have to be a spreadsheet with forty lines. The 50/30/20 rule splits take-home income into three buckets: about half for needs, about a third for wants, and at least a fifth for savings and paying down debt.',
      'Needs are things you would have to pay even in a tough month: rent, utilities, groceries, transport to work, insurance, minimum loan payments. Wants are everything else: eating out, streaming, shopping, holidays.',
      'Treat the numbers as a starting point, not a law. In an expensive city, rent alone can be half your income; then the useful question is which want to trim, not whether you have failed.',
      'Look at the split every few months. When needs creep above 60%, that is a signal to renegotiate a big fixed cost rather than cut coffee.',
    ],
    takeaway: 'Compare your split to 50/30/20, then adjust the biggest line rather than the smallest.',
    tryIt: { label: 'Adjust your budgets', href: '/demo/plan' },
    personalise: (state, today) => {
      const months = lastMonths(state, today, 3).map((m) => m.month)
      let needs = 0
      let wants = 0
      for (const month of months) {
        for (const [id, amount] of categorySpendForMonth(state.transactions, month)) {
          if (id === 'tax-payment') continue
          if (getCategory(id).essential) needs += amount
          else wants += amount
        }
      }
      const income = avgIncome(state, today) * months.length
      if (income <= 0) return 'With some income recorded, you will see your own needs/wants/savings split here.'
      const saved = Math.max(0, income - needs - wants)
      return `Over the last three months, about ${pct(needs / income)} of your income went to needs, ${pct(wants / income)} to wants and ${pct(saved / income)} was left over.`
    },
  },
  {
    id: 'cash-flow-chart',
    title: 'Reading a cash-flow chart',
    summary: 'What the bars and the line actually tell you, and what they hide.',
    minutes: 2,
    body: [
      'A cash-flow chart shows money in and money out for each month. The gap between the two bars is your net: positive when you kept something, negative when you spent more than came in.',
      'Look for the pattern before the details. Are most months positive? Is the out bar slowly getting taller while the in bar stays flat? A slow climb in costs is easy to miss month to month but obvious over a year.',
      'One bad month is not a problem; a run of them is. Seasonal businesses and freelancers will see big swings, so compare a month with the same month last year, or look at a three-month average.',
      'Remember what the chart does not show: money you are owed but have not received, and bills that arrive once a year. A good month on the chart can still hide a tax bill that is coming.',
    ],
    takeaway: 'Watch the trend in the gap between in and out, not any single month.',
    tryIt: { label: 'Open the overview', href: '/demo' },
    personalise: (state, today) => {
      const months = lastMonths(state, today, 12)
      if (!months.length) return 'Your own chart will appear once there is a month of data.'
      const negative = months.filter((m) => m.net < 0).length
      const best = months.reduce((a, b) => (b.net > a.net ? b : a))
      const worst = months.reduce((a, b) => (b.net < a.net ? b : a))
      return `In the last 12 months you spent more than you earned in ${negative} month${negative === 1 ? '' : 's'}. Your best month kept ${moneyCompact(best.net)}, your worst lost ${moneyCompact(-worst.net)}.`
    },
  },
  {
    id: 'subscription-audit',
    title: 'The subscription audit',
    summary: 'Small monthly charges add up to a big yearly number.',
    minutes: 2,
    body: [
      'Subscriptions are designed to be easy to start and easy to forget. Each one looks small, which is exactly why they pile up: ten services at $13 is over $1,500 a year.',
      'Once or twice a year, list every recurring charge from your statement. For each one ask: did I use this in the last month? Would I sign up again today at this price?',
      'Cancel anything that gets a "no", and rotate the rest: keep one streaming service at a time and switch when you have watched what you wanted. Watch for quiet price rises; they are announced by email and rarely noticed.',
      'Annual plans are cheaper only if you would have kept the service all year anyway. Free trials should get a calendar reminder the day you start them.',
    ],
    takeaway: 'Multiply each subscription by 12 and keep only the ones worth that yearly price.',
    tryIt: { label: 'See your subscriptions', href: '/demo/insights#subscriptions' },
    personalise: (state, today) => {
      const subs = detectSubscriptions(state, today).filter((s) => s.active)
      if (!subs.length) return 'No recurring charges were found in your transactions.'
      const monthly = subs.reduce((s, x) => s + x.monthlyCost, 0)
      return `You have ${subs.length} active subscriptions costing ${money(monthly)} a month, or ${money(monthly * 12, { whole: true })} a year. The biggest is ${subs[0].merchant} at ${money(subs[0].amount)}.`
    },
  },
  {
    id: 'invoice-terms',
    title: 'Invoice terms and late payers',
    summary: 'Getting paid on time is part of the work, not an awkward extra.',
    minutes: 2,
    body: [
      'Payment terms say when an invoice is due: "net 14" means 14 days after the invoice date. Shorter terms get you paid sooner, and many clients simply pay on the last allowed day, so the terms you choose matter.',
      'Make paying easy: a clear invoice number, what the work was, the total, the due date and how to pay, all on one page. Send it the day the work is delivered, not at the end of the month.',
      'Have a routine for late invoices: a friendly reminder the day after the due date, a firmer one a week later, then a call. Most late payments are disorganisation, not bad intent.',
      'If one client is always late, plan around it: ask for a deposit before starting, invoice in smaller milestones, or adjust your price for the cost of waiting. Do not count their money as available until it arrives.',
    ],
    takeaway: 'Invoice immediately, follow up the day after the due date, and plan as if slow payers will stay slow.',
    tryIt: { label: 'Open invoices', href: '/demo/invoices' },
    personalise: (state, today) => {
      const stats = clientStats(state, today).filter((s) => s.paidCount > 0)
      const r = receivablesSummary(state.invoices, today)
      if (!stats.length) return 'Once you send and get paid for a few invoices, you will see how quickly each client pays.'
      const slowest = stats.reduce((a, b) => ((b.avgDaysLate ?? 0) > (a.avgDaysLate ?? 0) ? b : a))
      const late = slowest.avgDaysLate ?? 0
      const lateText = late > 0 ? `${late} days after the due date` : 'on time'
      return `${slowest.client.name} pays ${lateText} on average. Right now ${money(r.outstanding, { whole: true })} is waiting to be paid, ${money(r.overdue, { whole: true })} of it overdue.`
    },
  },
  {
    id: 'separate-money',
    title: 'Separating business and personal money',
    summary: 'Two accounts make taxes, decisions and peace of mind easier.',
    minutes: 2,
    body: [
      'When client payments, rent, groceries and software all flow through one account, it is hard to answer basic questions: Is the business actually making money? How much of this balance can I spend?',
      'A separate account for business income and costs fixes that. Clients pay into it, business costs come out of it, and you pay yourself a regular amount into your personal account, like a salary.',
      'It also makes tax time faster: the business account statement is already the list of business income and expenses. Mixed accounts mean sorting every line by hand and missing deductions.',
      'You do not need anything fancy: a second, free current account is enough to start. The habit matters more than the bank.',
    ],
    takeaway: 'Keep business money in its own account and pay yourself a fixed amount from it.',
    tryIt: { label: 'Filter business transactions', href: '/demo/transactions?group=business' },
    personalise: (state, today) => {
      const month = addMonthsToKey(monthKey(today), -1)
      const everyday = new Set(state.accounts.filter((a) => a.purpose === 'everyday').map((a) => a.id))
      const tx = state.transactions.filter((t) => monthKey(t.date) === month && everyday.has(t.accountId) && t.amount < 0)
      const business = tx.filter((t) => getCategory(t.categoryId).group === 'business' && t.categoryId !== 'tax-payment').length
      const personal = tx.filter((t) => getCategory(t.categoryId).group === 'personal' && t.categoryId !== 'transfer').length
      if (getPersona(state.personaId).kind === 'business') {
        return `Last month ${business} business payments went through your operating account, with nothing personal mixed in: that is the goal.`
      }
      if (!business) return `Last month your everyday account had ${personal} personal payments and no business costs mixed in.`
      return `Last month ${business} business payments and ${personal} personal ones went through the same everyday account.`
    },
  },
  {
    id: 'deductible',
    title: 'What "deductible" means',
    summary: 'Business costs lower the profit you pay tax on, not the tax itself.',
    minutes: 2,
    body: [
      'A deductible cost is one you are allowed to subtract from your income before tax is calculated. If you earn $10,000 and spend $2,000 on things you need to do the work, tax is worked out on $8,000.',
      'That means a deduction saves you the tax rate, not the full amount. At a 20% rate, a $100 deductible cost saves $20 of tax; you still spent $80 more than if you had not bought it. Never buy something only because it is deductible.',
      'What counts varies by country and situation, but the general idea is costs that are wholly for the business: software, equipment, a workspace, professional fees. Personal spending usually does not count, even if you think about work while doing it.',
      'Keep receipts and categorise costs as you go. A deduction you cannot show is a deduction you will not claim.',
    ],
    takeaway: 'A deduction saves you your tax rate on the cost, not the whole cost.',
    tryIt: { label: 'See deductions in the tax planner', href: '/demo/tax' },
    personalise: (state, today) => {
      const tax = estimateTax(state, Number(today.slice(0, 4)), today)
      if (tax.deductions <= 0) return 'You have no deductible business costs recorded this year.'
      const without = taxOn(Math.max(0, tax.taxableIncome - tax.allowance), state.taxSettings)
      return `Your ${money(tax.deductions, { whole: true })} of deductible costs this year lower the estimated tax by about ${money(without - tax.estimatedTax, { whole: true })}.`
    },
  },
  {
    id: 'irregular-income',
    title: 'Budgeting with irregular income',
    summary: 'Plan around your lean months, not your average one.',
    minutes: 2,
    body: [
      'When income jumps around, the average month is misleading: you never actually live through it. Planning around the average means every below-average month is a small crisis.',
      'Instead, find your baseline: the amount you earned in a typical lean month. Build fixed costs and regular savings around that number.',
      'In good months, the extra goes first to the tax reserve, then to a "smoothing" buffer. In lean months, you top up from that buffer to reach your baseline. Over a year, your personal spending looks like a steady salary even if the income does not.',
      'Track income over twelve months, not one. A single great month is not a raise, and a single bad month is not a crisis.',
    ],
    takeaway: 'Set your spending by your lean months and let good months refill a buffer.',
    tryIt: { label: 'See the income chart', href: '/demo' },
    personalise: (state, today) => {
      const months = lastMonths(state, today, 12)
      if (!months.length) return 'After a few months of income you will see your own lean-month baseline here.'
      const sorted = [...months].sort((a, b) => a.income - b.income)
      const lean = sorted[Math.floor(sorted.length * 0.25)].income
      const avg = months.reduce((s, m) => s + m.income, 0) / months.length
      return `Your income averaged ${money(avg, { whole: true })} a month, but a lean month brought in about ${money(lean, { whole: true })}. That lower figure is the safer base for fixed costs.`
    },
  },
]

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}
