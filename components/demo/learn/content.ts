export const TOPICS: Record<string, string> = {
  'pay-yourself-first': 'Saving',
  'tax-set-aside': 'Tax',
  'emergency-buffer': 'Saving',
  'budget-50-30-20': 'Budgeting',
  'cash-flow-chart': 'Reading numbers',
  'subscription-audit': 'Spending',
  'invoice-terms': 'Getting paid',
  'separate-money': 'Organising',
  deductible: 'Tax',
  'irregular-income': 'Budgeting',
}

export interface Question {
  prompt: string
  options: string[]
  answer: number
  explain: string
}

export const QUESTIONS: Record<string, Question> = {
  'pay-yourself-first': {
    prompt: 'When does “pay yourself first” move money into savings?',
    options: ['At the end of the month, from whatever is left', 'The day income arrives, before anything else is spent', 'Only in months with a bonus'],
    answer: 1,
    explain: 'Saving first means the amount is decided in advance and moved straight away, so spending adjusts to what is left, not the other way round.',
  },
  'tax-set-aside': {
    prompt: 'A client pays you $2,000 and your rule is to set aside 20%. What do you do?',
    options: ['Move $400 to the tax reserve today', 'Spend it now and pay the tax from next month’s income', 'Wait until the tax bill arrives'],
    answer: 0,
    explain: 'The $400 was never yours to spend. Moving it the same day keeps it out of reach until the tax is due.',
  },
  'emergency-buffer': {
    prompt: 'You usually spend $2,000 a month. A three-month emergency buffer is…',
    options: ['$2,000', '$6,000', '$24,000'],
    answer: 1,
    explain: 'Three months of usual spending: 3 × $2,000 = $6,000, kept somewhere you can reach quickly.',
  },
  'budget-50-30-20': {
    prompt: 'Which of these is a “need” in the 50/30/20 split?',
    options: ['A streaming service', 'Rent', 'Eating out'],
    answer: 1,
    explain: 'Needs are the bills you would still pay in a tough month. Streaming and eating out are wants.',
  },
  'cash-flow-chart': {
    prompt: 'Your “out” bars have crept up for six months while income stayed flat. What does that tell you?',
    options: ['Nothing: only single months matter', 'Costs are slowly rising, so it is worth finding which ones', 'You are earning more'],
    answer: 1,
    explain: 'A slow climb is the pattern a cash-flow chart is best at showing. The next step is the category breakdown.',
  },
  'subscription-audit': {
    prompt: 'A $12.99 monthly subscription costs about how much a year?',
    options: ['$13', '$156', '$1,299'],
    answer: 1,
    explain: '$12.99 × 12 ≈ $156. Multiplying by twelve is the quickest way to judge whether a subscription is worth it.',
  },
  'invoice-terms': {
    prompt: 'An invoice dated 1 March has “net 14” terms. When is it due?',
    options: ['1 March', '15 March', '14 April'],
    answer: 1,
    explain: '“Net 14” means 14 days after the invoice date: 1 March + 14 days = 15 March.',
  },
  'separate-money': {
    prompt: 'What is the main benefit of a separate business account?',
    options: ['It pays more interest', 'Business income and costs are already sorted when tax time comes', 'Clients pay faster'],
    answer: 1,
    explain: 'The business statement becomes your list of business income and costs, so nothing has to be untangled by hand.',
  },
  deductible: {
    prompt: 'At a 20% tax rate, how much tax does a $100 deductible cost save?',
    options: ['$100', '$20', '$80'],
    answer: 1,
    explain: 'The deduction lowers taxable profit by $100, and tax on $100 at 20% is $20. You still spent the other $80.',
  },
  'irregular-income': {
    prompt: 'With irregular income, what should fixed costs be planned around?',
    options: ['Your best month', 'Your average month', 'A typical lean month'],
    answer: 2,
    explain: 'If fixed costs fit a lean month, every better month adds to the buffer instead of rescuing you.',
  },
}

export interface GlossaryTerm {
  term: string
  definition: string
  /** Where the idea shows up in the demo. */
  see?: { label: string; href: string }
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Cash flow', definition: 'Money coming in minus money going out over a period. Positive cash flow means the balance grew.', see: { label: 'Overview chart', href: '/demo' } },
  { term: 'Gross and net', definition: 'Gross is everything earned before anything is taken off. Net is what is left after tax and costs: for a salary, the amount that reaches your account; for a business, profit after expenses.' },
  { term: 'Savings rate', definition: 'The share of your income you keep: (income − spending) ÷ income. 20% means you keep $1 of every $5.', see: { label: 'Health score', href: '/demo/insights' } },
  { term: 'Emergency buffer', definition: 'Easy-to-reach savings for surprises, measured in months of usual spending. Three months is a common first target.', see: { label: 'Goals', href: '/demo/plan' } },
  { term: 'Runway', definition: 'How long your money would last if nothing new came in, or at your current rate of loss. Usually said in months.', see: { label: 'Forecast', href: '/demo/insights' } },
  { term: 'Fixed and variable costs', definition: 'Fixed costs stay the same each month (rent, loan payments, subscriptions). Variable costs move with how you live or how busy you are (groceries, supplies).' },
  { term: 'Budget', definition: 'A limit you choose in advance for a category of spending, usually per month, so you notice before you overspend rather than after.', see: { label: 'Budgets', href: '/demo/plan' } },
  { term: 'Subscription creep', definition: 'Small recurring charges that pile up one at a time until together they are a large monthly cost.', see: { label: 'Subscriptions audit', href: '/demo/insights#subscriptions' } },
  { term: 'Payment terms', definition: 'How long a client has to pay an invoice. “Net 30” means within 30 days of the invoice date.' },
  { term: 'Receivable', definition: 'Money a client owes you for an invoice you have sent but not yet been paid for. It is yours, but you cannot spend it yet. Once it is past its due date it is overdue.', see: { label: 'Invoices', href: '/demo/invoices' } },
  { term: 'Taxable income', definition: 'The income tax is worked out on. For self-employed work it is usually income minus allowed business costs.' },
  { term: 'Deductible expense', definition: 'A cost you may subtract from income before tax is calculated. It saves you the tax rate on the cost, not the whole cost.', see: { label: 'Tax planner', href: '/demo/tax' } },
  { term: 'Tax reserve', definition: 'A separate account where you put a fixed share of each payment, so the money for tax is there when the bill arrives.', see: { label: 'Tax planner', href: '/demo/tax' } },
  { term: 'Estimated tax payments', definition: 'Payments made during the year (often quarterly) towards tax on income that nobody withholds for you.' },
  { term: 'Profit margin', definition: 'The share of revenue left after costs. A 15% margin means $15 of every $100 in sales is left over.' },
]
