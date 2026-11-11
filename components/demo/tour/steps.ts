export type TourStepId = 'overview' | 'transactions' | 'invoices' | 'tax' | 'insights'

export interface TourStep {
  id: TourStepId
  /** Page the step lives on. */
  path: string
  /** CSS selectors tried in order; the first visible match gets the spotlight. */
  targets: string[]
  title: string
}

export const TOUR_STEPS: TourStep[] = [
  { id: 'overview', path: '/demo', targets: ['[data-tour="overview-summary"]'], title: 'Start with one sentence' },
  { id: 'transactions', path: '/demo/transactions', targets: ['[data-tour="ledger"] li', '[data-tour="ledger"]'], title: 'Sorted by plain rules' },
  {
    id: 'invoices',
    path: '/demo/invoices',
    targets: ['[data-tour="invoice-overdue"]', '[data-tour="invoice-unpaid"]', '[data-tour="invoice-list"]'],
    title: 'Mark the late invoice paid',
  },
  { id: 'tax', path: '/demo/tax', targets: ['[data-tour="tax-estimate"]'], title: 'Tax moves with it' },
  { id: 'insights', path: '/demo/insights', targets: ['[data-tour="weak-point"]', '[data-tour="health"]'], title: 'The weak spot, and why' },
]

/** Used when a step's own target is missing: the page heading. */
export const FALLBACK_TARGET = '#demo-main h1'

export interface CaptionContext {
  /** The visitor marked an invoice paid during this tour. */
  paid: boolean
  /** There is an unpaid invoice to mark paid. */
  hasUnpaid: boolean
  overdue: boolean
}

/** At most two sentences per step. */
export function caption(id: TourStepId, ctx: CaptionContext): string {
  switch (id) {
    case 'overview':
      return 'Every visit starts with a plain summary of where your money stands. The figures and the chart below only back it up.'
    case 'transactions':
      return 'Each bank line is sorted automatically by simple rules. Click a row to see which rule fired and why.'
    case 'invoices':
      if (ctx.paid) return 'Paid. The money is now income, so the tax estimate and the health score have already moved.'
      if (!ctx.hasUnpaid) return 'Invoices you send live here. When one is marked paid, it flows into income, tax and the health score at once.'
      return ctx.overdue
        ? 'This client is past the due date. Open the invoice and mark it paid, then watch what changes.'
        : 'Open an unpaid invoice and mark it paid, then watch what changes.'
    case 'tax':
      return ctx.paid
        ? 'The paid invoice just raised this estimate. The ring shows how much is still to set aside to stay covered.'
        : 'This is the tax owed on what came in so far this year. The ring shows how much is still to set aside to stay covered.'
    case 'insights':
      return 'The health score sums up six plain checks, and this is the weakest spot they found. “Learn why” opens a two-minute lesson on it.'
  }
}
