import type { Persona, PersonaId } from './types'

// Fictional people and businesses. Any resemblance to real ones is a coincidence.

const freelancer: Persona = {
  id: 'freelancer',
  name: 'Maya Chen',
  role: 'Freelance product designer',
  initials: 'MC',
  kind: 'individual',
  blurb: 'Designs apps for five clients. Income arrives in lumps, and some clients pay late.',
  story:
    'Maya puts aside about 8% of each payment for tax, but her profit needs closer to 18%, and her last quarterly payment never went out. One client pays a month late on average, so a big part of her income is stuck in unpaid invoices.',
  expectedWeakPoints: ['tax-shortfall', 'late-payer'],
  accounts: [
    { id: 'checking', name: 'Everyday checking', type: 'checking', purpose: 'everyday', institution: 'Harbor Federal', last4: '4821', openingBalance: 6_800, openingDate: '' },
    { id: 'tax', name: 'Tax reserve', type: 'savings', purpose: 'tax', institution: 'Harbor Federal', last4: '7310', openingBalance: 2_400, openingDate: '' },
    { id: 'savings', name: 'Savings', type: 'savings', purpose: 'savings', institution: 'Harbor Federal', last4: '7311', openingBalance: 9_000, openingDate: '' },
  ],
  clients: [
    { id: 'lumen', name: 'Lumen Health', email: 'accounts@lumenhealth.example', termsDays: 30 },
    { id: 'northwind', name: 'Northwind Logistics', email: 'ap@northwind-logistics.example', termsDays: 30 },
    { id: 'pollen', name: 'Pollen Studio', email: 'hello@pollen.example', termsDays: 14 },
    { id: 'kestrel', name: 'Kestrel Apps', email: 'finance@kestrelapps.example', termsDays: 30 },
    { id: 'fernway', name: 'Fernway Books', email: 'office@fernwaybooks.example', termsDays: 15 },
  ],
  budgets: [
    { categoryId: 'groceries', monthlyLimit: 550 },
    { categoryId: 'dining', monthlyLimit: 450 },
    { categoryId: 'shopping', monthlyLimit: 250 },
    { categoryId: 'transport', monthlyLimit: 180 },
    { categoryId: 'software', monthlyLimit: 160 },
    { categoryId: 'subscriptions', monthlyLimit: 40 },
  ],
  goals: [
    { id: 'goal-buffer', name: 'Six-month safety net', target: 30_000, saved: 0, accountId: 'savings' },
    { id: 'goal-laptop', name: 'Next laptop', target: 2_800, saved: 900, targetDate: '' },
  ],
  rules: [
    { id: 'rule-lumen', match: 'contains', pattern: 'lumen health', categoryId: 'client-income' },
    { id: 'rule-northwind', match: 'contains', pattern: 'northwind', categoryId: 'client-income' },
    { id: 'rule-pollen', match: 'contains', pattern: 'pollen studio', categoryId: 'client-income' },
    { id: 'rule-kestrel', match: 'contains', pattern: 'kestrel apps', categoryId: 'client-income' },
    { id: 'rule-fernway', match: 'contains', pattern: 'fernway', categoryId: 'client-income' },
  ],
  taxSettings: { method: 'profit', rate: 0.2, allowance: 0, scope: 'All self-employed profit' },
}

const starter: Persona = {
  id: 'starter',
  name: 'Daniel Okafor',
  role: 'Junior data analyst, first full-time job',
  initials: 'DO',
  kind: 'individual',
  blurb: 'Salary in, rent out, and a small side gig building dashboards. Money seems to vanish by the end of the month.',
  story:
    'Daniel signed up for one streaming trial after another: his subscriptions tripled in a year. With almost nothing saved, one surprise bill would land on his credit card.',
  expectedWeakPoints: ['subscription-creep', 'low-buffer'],
  accounts: [
    { id: 'checking', name: 'Everyday checking', type: 'checking', purpose: 'everyday', institution: 'Northbank', last4: '2290', openingBalance: 2_600, openingDate: '' },
    { id: 'savings', name: 'Savings', type: 'savings', purpose: 'savings', institution: 'Northbank', last4: '2291', openingBalance: 450, openingDate: '' },
  ],
  clients: [{ id: 'hearth', name: 'Hearth & Crumb Bakery', email: 'owner@hearthandcrumb.example', termsDays: 14 }],
  budgets: [
    { categoryId: 'groceries', monthlyLimit: 320 },
    { categoryId: 'dining', monthlyLimit: 400 },
    { categoryId: 'shopping', monthlyLimit: 200 },
    { categoryId: 'subscriptions', monthlyLimit: 60 },
    { categoryId: 'transport', monthlyLimit: 180 },
    { categoryId: 'entertainment', monthlyLimit: 80 },
  ],
  goals: [
    { id: 'goal-buffer', name: 'Emergency fund', target: 3_000, saved: 0, accountId: 'savings' },
    { id: 'goal-trip', name: 'Visit family in Lagos', target: 1_800, saved: 150, targetDate: '' },
  ],
  rules: [{ id: 'rule-hearth', match: 'contains', pattern: 'hearth', categoryId: 'client-income' }],
  taxSettings: { method: 'profit', rate: 0.15, allowance: 0, scope: 'Side income only (salary is taxed by the employer)' },
}

const business: Persona = {
  id: 'business',
  name: 'Brew & Bloom',
  role: 'Two-person coffee kiosk',
  initials: 'BB',
  kind: 'business',
  blurb: 'A coffee and pastry kiosk in a market hall, run by two co-owners and a part-time barista.',
  story:
    'Sales are steady, but beans, milk and packaging got noticeably more expensive over the year while prices on the menu stayed the same. Margins are shrinking and the cash in the bank covers only a few weeks of costs.',
  expectedWeakPoints: ['cost-growth', 'thin-runway'],
  accounts: [
    { id: 'checking', name: 'Operating account', type: 'checking', purpose: 'everyday', institution: 'Commerce Mutual', last4: '6604', openingBalance: 6_500, openingDate: '' },
    { id: 'savings', name: 'Business reserve', type: 'savings', purpose: 'savings', institution: 'Commerce Mutual', last4: '6605', openingBalance: 2_500, openingDate: '' },
  ],
  clients: [
    { id: 'harbor', name: 'Harbor Coworking', email: 'office@harborcowork.example', termsDays: 14 },
    { id: 'linden', name: 'Linden Street Library', email: 'events@lindenlibrary.example', termsDays: 30 },
  ],
  budgets: [
    { categoryId: 'supplies', monthlyLimit: 4_600 },
    { categoryId: 'marketing', monthlyLimit: 150 },
    { categoryId: 'equipment', monthlyLimit: 250 },
    { categoryId: 'software', monthlyLimit: 60 },
    { categoryId: 'utilities', monthlyLimit: 260 },
  ],
  goals: [
    { id: 'goal-buffer', name: 'Two months of costs in reserve', target: 24_000, saved: 0, accountId: 'savings' },
    { id: 'goal-grinder', name: 'Second grinder', target: 1_900, saved: 400, targetDate: '' },
  ],
  rules: [
    { id: 'rule-roastworks', match: 'contains', pattern: 'roastworks', categoryId: 'supplies' },
    { id: 'rule-dairy', match: 'contains', pattern: 'valley dairy', categoryId: 'supplies' },
    { id: 'rule-bakery', match: 'contains', pattern: 'sunrise bakery', categoryId: 'supplies' },
    { id: 'rule-ecopack', match: 'contains', pattern: 'ecopack', categoryId: 'supplies' },
    { id: 'rule-lease', match: 'contains', pattern: 'market hall', categoryId: 'workspace' },
    { id: 'rule-cash', match: 'contains', pattern: 'cash deposit', categoryId: 'sales' },
    { id: 'rule-harbor', match: 'contains', pattern: 'harbor coworking', categoryId: 'sales' },
    { id: 'rule-linden', match: 'contains', pattern: 'linden st', categoryId: 'sales' },
  ],
  taxSettings: { method: 'profit', rate: 0.2, allowance: 0, scope: 'Business profit' },
}

export const PERSONAS: Record<PersonaId, Persona> = { freelancer, starter, business }

export const PERSONA_IDS: readonly PersonaId[] = ['freelancer', 'starter', 'business']

export const DEFAULT_PERSONA: PersonaId = 'freelancer'

export function isPersonaId(id: unknown): id is PersonaId {
  return typeof id === 'string' && (PERSONA_IDS as readonly string[]).includes(id)
}

export function getPersona(id: PersonaId): Persona {
  return PERSONAS[id]
}
