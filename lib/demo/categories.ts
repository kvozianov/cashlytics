import type { Category, CategoryId, CategoryKind } from './types'

type Def = Omit<Category, 'id' | 'essential'> & { essential?: boolean }

const defs: Record<CategoryId, Def> = {
  // Income
  salary: { label: 'Salary', kind: 'income', group: 'personal', icon: 'Briefcase', color: 'cat-6', deductibleByDefault: false, taxableByDefault: false },
  'client-income': { label: 'Client income', kind: 'income', group: 'business', icon: 'BadgeDollarSign', color: 'cat-3', deductibleByDefault: false, taxableByDefault: true },
  sales: { label: 'Sales', kind: 'income', group: 'business', icon: 'Store', color: 'cat-1', deductibleByDefault: false, taxableByDefault: true },
  'other-income': { label: 'Interest & other income', kind: 'income', group: 'personal', icon: 'PiggyBank', color: 'cat-10', deductibleByDefault: false, taxableByDefault: false },

  // Business costs
  software: { label: 'Software & tools', kind: 'expense', group: 'business', icon: 'AppWindow', color: 'cat-1', deductibleByDefault: true, taxableByDefault: false },
  workspace: { label: 'Workspace & lease', kind: 'expense', group: 'business', icon: 'Building2', color: 'cat-7', deductibleByDefault: true, taxableByDefault: false, essential: true },
  equipment: { label: 'Equipment', kind: 'expense', group: 'business', icon: 'Laptop', color: 'cat-12', deductibleByDefault: true, taxableByDefault: false },
  supplies: { label: 'Stock & supplies', kind: 'expense', group: 'business', icon: 'Package', color: 'cat-2', deductibleByDefault: true, taxableByDefault: false, essential: true },
  payroll: { label: 'Payroll', kind: 'expense', group: 'business', icon: 'Users', color: 'cat-3', deductibleByDefault: true, taxableByDefault: false, essential: true },
  marketing: { label: 'Marketing', kind: 'expense', group: 'business', icon: 'Megaphone', color: 'cat-5', deductibleByDefault: true, taxableByDefault: false },
  'professional-services': { label: 'Professional services', kind: 'expense', group: 'business', icon: 'Scale', color: 'cat-9', deductibleByDefault: true, taxableByDefault: false },
  'business-insurance': { label: 'Business insurance', kind: 'expense', group: 'business', icon: 'ShieldCheck', color: 'cat-11', deductibleByDefault: true, taxableByDefault: false, essential: true },
  fees: { label: 'Bank & payment fees', kind: 'expense', group: 'business', icon: 'Receipt', color: 'cat-10', deductibleByDefault: true, taxableByDefault: false },
  'business-loan': { label: 'Equipment loan', kind: 'expense', group: 'business', icon: 'Landmark', color: 'cat-4', deductibleByDefault: false, taxableByDefault: false, essential: true },

  // Personal spending
  housing: { label: 'Rent & housing', kind: 'expense', group: 'personal', icon: 'Home', color: 'cat-1', deductibleByDefault: false, taxableByDefault: false, essential: true },
  utilities: { label: 'Utilities', kind: 'expense', group: 'personal', icon: 'Zap', color: 'cat-4', deductibleByDefault: false, taxableByDefault: false, essential: true },
  'phone-internet': { label: 'Phone & internet', kind: 'expense', group: 'personal', icon: 'Wifi', color: 'cat-9', deductibleByDefault: false, taxableByDefault: false, essential: true },
  groceries: { label: 'Groceries', kind: 'expense', group: 'personal', icon: 'ShoppingCart', color: 'cat-3', deductibleByDefault: false, taxableByDefault: false, essential: true },
  dining: { label: 'Eating out & coffee', kind: 'expense', group: 'personal', icon: 'Coffee', color: 'cat-2', deductibleByDefault: false, taxableByDefault: false },
  transport: { label: 'Transport', kind: 'expense', group: 'personal', icon: 'Car', color: 'cat-7', deductibleByDefault: false, taxableByDefault: false, essential: true },
  travel: { label: 'Travel', kind: 'expense', group: 'personal', icon: 'Plane', color: 'cat-10', deductibleByDefault: false, taxableByDefault: false },
  shopping: { label: 'Shopping', kind: 'expense', group: 'personal', icon: 'ShoppingBag', color: 'cat-5', deductibleByDefault: false, taxableByDefault: false },
  subscriptions: { label: 'Subscriptions', kind: 'expense', group: 'personal', icon: 'Repeat', color: 'cat-8', deductibleByDefault: false, taxableByDefault: false },
  'health-fitness': { label: 'Health & fitness', kind: 'expense', group: 'personal', icon: 'HeartPulse', color: 'cat-6', deductibleByDefault: false, taxableByDefault: false },
  insurance: { label: 'Insurance', kind: 'expense', group: 'personal', icon: 'Shield', color: 'cat-11', deductibleByDefault: false, taxableByDefault: false, essential: true },
  education: { label: 'Education', kind: 'expense', group: 'personal', icon: 'GraduationCap', color: 'cat-9', deductibleByDefault: false, taxableByDefault: false },
  debt: { label: 'Loan repayments', kind: 'expense', group: 'personal', icon: 'Landmark', color: 'cat-12', deductibleByDefault: false, taxableByDefault: false, essential: true },
  entertainment: { label: 'Entertainment', kind: 'expense', group: 'personal', icon: 'Ticket', color: 'cat-11', deductibleByDefault: false, taxableByDefault: false },
  'personal-care': { label: 'Personal care', kind: 'expense', group: 'personal', icon: 'Sparkles', color: 'cat-5', deductibleByDefault: false, taxableByDefault: false },
  gifts: { label: 'Gifts & donations', kind: 'expense', group: 'personal', icon: 'Gift', color: 'cat-10', deductibleByDefault: false, taxableByDefault: false },

  // Other
  'tax-payment': { label: 'Tax payments', kind: 'expense', group: 'business', icon: 'Landmark', color: 'cat-8', deductibleByDefault: false, taxableByDefault: false },
  transfer: { label: 'Transfers', kind: 'transfer', group: 'personal', icon: 'ArrowLeftRight', color: 'muted', deductibleByDefault: false, taxableByDefault: false },
  uncategorised: { label: 'Uncategorised', kind: 'expense', group: 'personal', icon: 'CircleHelp', color: 'muted', deductibleByDefault: false, taxableByDefault: false },
}

export const CATEGORIES: readonly Category[] = (Object.keys(defs) as CategoryId[]).map((id) => ({
  id,
  ...defs[id],
  essential: defs[id].essential ?? false,
}))

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id)

const byId = new Map<string, Category>(CATEGORIES.map((c) => [c.id, c]))

export function isCategoryId(id: string): id is CategoryId {
  return byId.has(id)
}

export function getCategory(id: CategoryId | string): Category {
  return byId.get(id) ?? byId.get('uncategorised')!
}

/** CSS colour for a category, e.g. `var(--cat-3)`; works in both themes. */
export function categoryColor(id: CategoryId | string): string {
  const color = getCategory(id).color
  return color === 'muted' ? 'var(--muted-foreground)' : `var(--${color})`
}

export function categoriesByKind(kind: CategoryKind): Category[] {
  return CATEGORIES.filter((c) => c.kind === kind)
}

/** Categories a person can assign by hand, grouped for pickers. */
export function categoryOptions(): { label: string; categories: Category[] }[] {
  return [
    { label: 'Income', categories: CATEGORIES.filter((c) => c.kind === 'income') },
    { label: 'Business', categories: CATEGORIES.filter((c) => c.kind === 'expense' && c.group === 'business') },
    { label: 'Personal', categories: CATEGORIES.filter((c) => c.kind === 'expense' && c.group === 'personal' && c.id !== 'uncategorised') },
    { label: 'Other', categories: CATEGORIES.filter((c) => c.kind === 'transfer') },
  ]
}
