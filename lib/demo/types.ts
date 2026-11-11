/** Calendar date without time, `YYYY-MM-DD`. */
export type ISODate = string
/** Calendar month, `YYYY-MM`. */
export type MonthKey = string

export type PersonaId = 'freelancer' | 'starter' | 'business'

export type CategoryKind = 'income' | 'expense' | 'transfer'
export type CategoryGroup = 'business' | 'personal'

export type CategoryId =
  // income
  | 'salary'
  | 'client-income'
  | 'sales'
  | 'other-income'
  // business costs
  | 'software'
  | 'workspace'
  | 'equipment'
  | 'supplies'
  | 'payroll'
  | 'marketing'
  | 'professional-services'
  | 'business-insurance'
  | 'fees'
  | 'business-loan'
  // personal spending
  | 'housing'
  | 'utilities'
  | 'phone-internet'
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'travel'
  | 'shopping'
  | 'subscriptions'
  | 'health-fitness'
  | 'insurance'
  | 'education'
  | 'debt'
  | 'entertainment'
  | 'personal-care'
  | 'gifts'
  // other
  | 'tax-payment'
  | 'transfer'
  | 'uncategorised'

/** A colour slot from the categorical palette (`--cat-1` … `--cat-12`) or the neutral muted colour. */
export type CategoryColor =
  | 'cat-1'
  | 'cat-2'
  | 'cat-3'
  | 'cat-4'
  | 'cat-5'
  | 'cat-6'
  | 'cat-7'
  | 'cat-8'
  | 'cat-9'
  | 'cat-10'
  | 'cat-11'
  | 'cat-12'
  | 'muted'

export interface Category {
  id: CategoryId
  label: string
  kind: CategoryKind
  group: CategoryGroup
  /** lucide-react icon component name, e.g. `ShoppingCart`. */
  icon: string
  color: CategoryColor
  deductibleByDefault: boolean
  taxableByDefault: boolean
  /** Everyday essentials, used for the emergency-buffer calculation. */
  essential: boolean
}

export type AccountType = 'checking' | 'savings'
export type AccountPurpose = 'everyday' | 'savings' | 'tax'

export interface Account {
  id: string
  name: string
  type: AccountType
  purpose: AccountPurpose
  institution: string
  last4: string
  /** Balance at the start of the generated window (`openingDate`). */
  openingBalance: number
  openingDate: ISODate
}

export type TransactionSource = 'bank' | 'manual' | 'import' | 'invoice'

export interface Transaction {
  id: string
  date: ISODate
  /** Raw description as the bank shows it. */
  description: string
  /** Cleaned merchant name, from `normaliseMerchant`. */
  merchant: string
  /** Signed USD amount: positive = money in, negative = money out. */
  amount: number
  accountId: string
  categoryId: CategoryId
  /** Categoriser confidence, 0..1. 1 when a person chose the category. */
  confidence: number
  /** Short human explanation of how the category was chosen. */
  reason: string
  source: TransactionSource
  /** True once a person confirmed or changed the category. */
  reviewed: boolean
  invoiceId?: string
  note?: string
}

export interface Client {
  id: string
  name: string
  email: string
  /** Payment terms in days (net 14, net 30…). */
  termsDays: number
}

export interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

/** Stored status. `overdue` is derived from the due date, see `invoiceStatus`. */
export type InvoiceStoredStatus = 'draft' | 'sent' | 'paid'
export type InvoiceStatus = InvoiceStoredStatus | 'overdue'

export interface Invoice {
  id: string
  /** Display number, e.g. `INV-014`. */
  number: string
  clientId: string
  issueDate: ISODate
  dueDate: ISODate
  lines: InvoiceLine[]
  notes?: string
  /** Optional tax added on top of the line items, 0..1 (e.g. 0.1 = 10 %). */
  taxRate?: number
  status: InvoiceStoredStatus
  sentDate?: ISODate
  paidDate?: ISODate
  /** Income transaction created when the invoice was paid. */
  transactionId?: string
}

export interface Budget {
  categoryId: CategoryId
  /** Monthly limit in USD. */
  monthlyLimit: number
}

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  targetDate?: ISODate
  /** Savings account that holds the money, if any. Contributions move money there. */
  accountId?: string
  /** Planned amount put towards the goal each month, USD. */
  monthlyContribution?: number
}

export type RuleMatch = 'exact' | 'contains'

export interface CategoryRule {
  id: string
  match: RuleMatch
  /** Compared case-insensitively against the normalised merchant (exact) or raw description (contains). */
  pattern: string
  categoryId: CategoryId
}

export interface TaxBracket {
  /** Upper bound of this band of taxable profit; `null` for the top band. */
  upTo: number | null
  rate: number
}

export interface TaxSettings {
  method: 'profit'
  /** Flat rate, 0..1. Used when `brackets` is empty. */
  rate: number
  brackets?: TaxBracket[]
  /** Tax-free amount deducted from profit before the rate applies. */
  allowance: number
  /** Short note shown in the UI, e.g. "Side income only". */
  scope: string
  /** Per-category override of `deductibleByDefault`. */
  deductibleOverrides?: Partial<Record<CategoryId, boolean>>
}

export type Period = 'this-month' | 'last-3-months' | 'ytd' | 'last-12-months'

export interface Persona {
  id: PersonaId
  name: string
  role: string
  initials: string
  kind: 'individual' | 'business'
  blurb: string
  /** The weak point the data is designed to reveal. */
  story: string
  /** Weak-point ids the insights engine is expected to rank first. */
  expectedWeakPoints: string[]
  accounts: Account[]
  clients: Client[]
  budgets: Budget[]
  goals: Goal[]
  rules: CategoryRule[]
  taxSettings: TaxSettings
}

export interface DemoState {
  version: 1
  personaId: PersonaId
  /** The date the data was generated for. */
  generatedOn: ISODate
  accounts: Account[]
  transactions: Transaction[]
  clients: Client[]
  invoices: Invoice[]
  budgets: Budget[]
  goals: Goal[]
  rules: CategoryRule[]
  taxSettings: TaxSettings
  period: Period
  completedLessons: string[]
  /** True after the first user change; edited states are not regenerated. */
  edited: boolean
  /** Counter for ids created in the browser. */
  seq: number
}
