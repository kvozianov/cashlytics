'use client'

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { toast } from 'sonner'

import { getCategory } from './categories'
import { toISODate } from './dates'
import { formatDate, money, signedMoney } from './format'
import { generateState } from './generate'
import { invoiceTotal } from './invoices'
import { getPersona } from './personas'
import { applyRule, demoReducer, type DemoAction, type NewInvoice, type NewTransaction } from './reducer'
import { clearState, externalChange, initialPersona, loadState, saveActivePersona, saveState, type KeyValueStore } from './storage'
import { accountBalances } from './analytics'
import { estimateTax } from './tax'
import type { Quarter } from './tax-dates'
import type { CategoryId, CategoryRule, Client, DemoState, Goal, Invoice, ISODate, Period, Persona, PersonaId, TaxSettings, Transaction } from './types'

export interface DemoActions {
  switchPersona: (id: PersonaId) => void
  /** Throws away this persona's changes and regenerates its data. */
  reset: () => void
  addTransaction: (tx: NewTransaction) => Transaction
  updateTransaction: (id: string, patch: Partial<Pick<Transaction, 'date' | 'description' | 'amount' | 'accountId' | 'note' | 'categoryId'>>) => void
  deleteTransaction: (id: string) => void
  /** Sets a category by hand; with `createRule`, also remembers it for the merchant. Returns how many other transactions changed. */
  recategorise: (id: string, categoryId: CategoryId, opts?: { createRule?: boolean }) => { updated: number }
  /** Accepts the suggested category (removes it from the review queue). */
  confirmCategory: (id: string) => void
  /** Sets one category on many transactions by hand (no rule). Returns how many changed. */
  recategoriseMany: (ids: string[], categoryId: CategoryId) => { updated: number }
  /** Deletes several transactions at once; linked invoices go back to unpaid. */
  deleteTransactions: (ids: string[]) => { deleted: number }
  /** Puts back an earlier snapshot of the current persona's data, for undo. */
  restore: (snapshot: DemoState, message?: string) => void
  addRule: (rule: Omit<CategoryRule, 'id'>, opts?: { applyToExisting?: boolean }) => { updated: number }
  removeRule: (id: string) => void
  importTransactions: (rows: { date: ISODate; description: string; amount: number }[], opts?: { accountId?: string }) => { added: number; skipped: number }
  addClient: (client: Omit<Client, 'id'>) => string
  addInvoice: (invoice: NewInvoice) => Invoice
  updateInvoice: (id: string, patch: Partial<Pick<Invoice, 'clientId' | 'issueDate' | 'dueDate' | 'lines' | 'notes' | 'taxRate'>>) => void
  deleteInvoice: (id: string) => void
  markInvoiceSent: (id: string) => void
  /** Creates the linked income transaction. Returns it and the change in this year's tax estimate. */
  markInvoicePaid: (id: string, date?: ISODate, opts?: { accountId?: string }) => { transaction?: Transaction; taxDelta: number }
  /** Moves money between two of the persona's accounts (a pair of transfer transactions). */
  transfer: (from: string, to: string, amount: number, opts?: { date?: ISODate; note?: string }) => void
  /** Adds an empty tax-reserve account if the persona has none. Returns its id. */
  openTaxReserve: () => string
  /** `null` removes the budget. */
  setBudget: (categoryId: CategoryId, monthlyLimit: number | null) => void
  addGoal: (goal: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => void
  deleteGoal: (id: string) => void
  /** Moves money towards a goal (negative to take it back). */
  contributeToGoal: (id: string, amount: number) => void
  updateTaxSettings: (patch: Partial<TaxSettings>) => void
  recordTaxPayment: (year: number, quarter: Quarter, amount: number, opts?: { date?: ISODate; accountId?: string }) => void
  setPeriod: (period: Period) => void
  completeLesson: (id: string) => void
}

export interface DemoContextValue {
  state: DemoState
  /** The demo's "today" as `YYYY-MM-DD` (the visitor's local date). */
  today: ISODate
  persona: Persona
  actions: DemoActions
}

const DemoContext = createContext<DemoContextValue | null>(null)

interface Loaded {
  state: DemoState
  today: ISODate
}

function browserStore(): KeyValueStore | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Loads, holds and saves the demo state in the browser; React reads it with useSyncExternalStore. */
class DemoStore {
  private loaded: Loaded | null = null
  private listeners = new Set<() => void>()
  readonly actions: DemoActions

  constructor() {
    this.actions = this.createActions()
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): Loaded | null => {
    if (!this.loaded && typeof window !== 'undefined') {
      const store = browserStore()
      const today = toISODate(new Date())
      const personaId = initialPersona(window.location.search, store)
      this.loaded = { state: loadState(store, personaId, today), today }
    }
    return this.loaded
  }

  getServerSnapshot = (): Loaded | null => null

  /**
   * Starts following other tabs: their saves arrive as `storage` events and are adopted
   * here without being written back. Also records the persona picked by `?persona=` right away.
   */
  connect = () => {
    const loaded = this.getSnapshot()
    if (loaded) saveActivePersona(browserStore(), loaded.state.personaId)
    window.addEventListener('storage', this.onStorage)
    return () => window.removeEventListener('storage', this.onStorage)
  }

  private onStorage = (event: StorageEvent) => {
    const store = browserStore()
    const loaded = this.loaded
    if (!loaded || !store || (event.storageArea && event.storageArea !== store)) return
    const change = externalChange(event.key, event.newValue, loaded.state.personaId)
    if (change.kind === 'ignore') return
    const state = loadState(store, change.personaId, loaded.today)
    if (change.personaId === loaded.state.personaId && JSON.stringify(state) === JSON.stringify(loaded.state)) return
    this.publish({ state, today: loaded.today })
  }

  private publish(next: Loaded) {
    this.loaded = next
    for (const listener of this.listeners) listener()
  }

  private commit(next: Loaded) {
    saveState(browserStore(), next.state)
    this.publish(next)
  }

  private createActions(): DemoActions {
    const current = () => {
      const loaded = this.getSnapshot()
      if (!loaded) throw new Error('Demo state is not loaded yet')
      return loaded
    }
    const commit = (next: Loaded) => this.commit(next)
    const apply = (action: DemoAction) => {
      const { state, today } = current()
      const next = demoReducer(state, action)
      if (next !== state) commit({ state: next, today })
      return { before: state, after: next, today }
    }
    const newest = (before: DemoState, after: DemoState) => after.transactions.find((t) => !before.transactions.some((b) => b.id === t.id))

    return {
      switchPersona(id) {
        const { state, today } = current()
        if (id === state.personaId) return
        const store = browserStore()
        saveState(store, state)
        commit({ state: loadState(store, id, today), today })
        toast(`Switched to ${getPersona(id).name}`, { description: getPersona(id).role })
      },
      reset() {
        const { state, today } = current()
        clearState(browserStore(), state.personaId)
        commit({ state: { ...generateState(state.personaId, today), period: state.period }, today })
        toast('Demo reset', { description: `Fresh data for ${getPersona(state.personaId).name}.` })
      },
      addTransaction(tx) {
        const { before, after } = apply({ type: 'addTransaction', tx })
        const created = newest(before, after)!
        toast(`Added ${created.merchant}`, { description: `${signedMoney(created.amount)} · ${getCategory(created.categoryId).label}` })
        return created
      },
      updateTransaction(id, patch) {
        apply({ type: 'updateTransaction', id, patch })
        toast('Transaction updated')
      },
      deleteTransaction(id) {
        const { before } = apply({ type: 'deleteTransaction', id })
        const tx = before.transactions.find((t) => t.id === id)
        toast('Transaction deleted', {
          description: tx?.invoiceId ? 'The linked invoice is unpaid again.' : tx ? `${tx.merchant} ${signedMoney(tx.amount)}` : undefined,
        })
      },
      recategorise(id, categoryId, opts) {
        const { before, after } = apply({ type: 'recategorise', id, categoryId, createRule: opts?.createRule })
        // A rule can also confirm the current category; those leave the review queue, so they count too.
        const previous = new Map(before.transactions.map((t) => [t.id, t]))
        const updated = after.transactions.filter((t) => t.id !== id && previous.get(t.id) !== undefined && previous.get(t.id) !== t).length
        toast(`Moved to ${getCategory(categoryId).label}`, {
          description: opts?.createRule ? `Rule saved${updated ? `, ${updated} similar transaction${updated === 1 ? '' : 's'} updated` : ''}.` : undefined,
        })
        return { updated }
      },
      confirmCategory(id) {
        apply({ type: 'confirmCategory', id })
      },
      recategoriseMany(ids, categoryId) {
        const { before, after } = apply({ type: 'recategoriseMany', ids, categoryId })
        const previous = new Map(before.transactions.map((t) => [t.id, t.categoryId]))
        const updated = after.transactions.filter((t) => ids.includes(t.id) && previous.get(t.id) !== t.categoryId).length
        if (before !== after) toast(`${ids.length} transaction${ids.length === 1 ? '' : 's'} moved to ${getCategory(categoryId).label}`)
        return { updated }
      },
      deleteTransactions(ids) {
        const { before, after } = apply({ type: 'deleteTransactions', ids })
        const deleted = before.transactions.length - after.transactions.length
        const reopened = before.transactions.filter((t) => t.invoiceId && ids.includes(t.id)).length
        if (deleted) {
          toast(`${deleted} transaction${deleted === 1 ? '' : 's'} deleted`, {
            description: reopened ? `${reopened} linked invoice${reopened === 1 ? ' is' : 's are'} unpaid again.` : undefined,
          })
        }
        return { deleted }
      },
      restore(snapshot, message) {
        const { state, today } = current()
        if (snapshot.personaId !== state.personaId) return
        commit({ state: snapshot, today })
        toast(message ?? 'Undone')
      },
      addRule(rule, opts) {
        const { state } = current()
        const updated = opts?.applyToExisting === false ? 0 : applyRule(state.transactions, { ...rule, id: 'preview' }).changed.length
        apply({ type: 'addRule', rule, applyToExisting: opts?.applyToExisting })
        toast('Rule added', { description: `"${rule.pattern}" → ${getCategory(rule.categoryId).label}${updated ? ` · ${updated} transactions updated` : ''}` })
        return { updated }
      },
      removeRule(id) {
        apply({ type: 'removeRule', id })
        toast('Rule removed')
      },
      importTransactions(rows, opts) {
        const { before, after } = apply({ type: 'importTransactions', rows, accountId: opts?.accountId })
        const added = after.transactions.length - before.transactions.length
        const skipped = rows.length - added
        toast(`Imported ${added} transaction${added === 1 ? '' : 's'}`, {
          description: skipped ? `${skipped} duplicate${skipped === 1 ? '' : 's'} skipped.` : undefined,
        })
        return { added, skipped }
      },
      addClient(client) {
        const { before, after } = apply({ type: 'addClient', client })
        const created = after.clients.find((c) => !before.clients.some((b) => b.id === c.id))!
        toast(`Client added: ${created.name}`)
        return created.id
      },
      addInvoice(invoice) {
        const { before, after } = apply({ type: 'addInvoice', invoice })
        const created = after.invoices.find((i) => !before.invoices.some((b) => b.id === i.id))!
        toast(`Invoice ${created.number} ${created.status === 'sent' ? 'created and sent' : 'saved as draft'}`, { description: money(invoiceTotal(created)) })
        return created
      },
      updateInvoice(id, patch) {
        apply({ type: 'updateInvoice', id, patch })
        toast('Invoice updated')
      },
      deleteInvoice(id) {
        const { before } = apply({ type: 'deleteInvoice', id })
        toast(`Invoice ${before.invoices.find((i) => i.id === id)?.number ?? ''} deleted`)
      },
      markInvoiceSent(id) {
        const { after } = apply({ type: 'markInvoiceSent', id, date: current().today })
        const inv = after.invoices.find((i) => i.id === id)
        toast(`Invoice ${inv?.number ?? ''} marked sent`, { description: inv ? `Due ${formatDate(inv.dueDate)}` : undefined })
      },
      markInvoicePaid(id, date, opts) {
        const { state: s0, today } = current()
        const year = Number((date ?? today).slice(0, 4))
        const taxBefore = estimateTax(s0, year, today).estimatedTax
        const { before, after } = apply({ type: 'markInvoicePaid', id, date: date ?? today, accountId: opts?.accountId })
        if (before === after) return { taxDelta: 0 }
        const transaction = newest(before, after)
        const taxDelta = estimateTax(after, year, today).estimatedTax - taxBefore
        const inv = after.invoices.find((i) => i.id === id)
        toast(`Invoice ${inv?.number ?? ''} marked paid`, {
          description: `${signedMoney(transaction?.amount ?? 0)} added to income${Math.abs(taxDelta) >= 1 ? ` · tax estimate ${signedMoney(taxDelta, { whole: true })}` : ''}`,
        })
        return { transaction, taxDelta }
      },
      transfer(from, to, amount, opts) {
        const { state: s0, today } = current()
        const { before, after } = apply({ type: 'transfer', from, to, amount, date: opts?.date ?? today, note: opts?.note })
        if (before === after) return
        const target = after.accounts.find((a) => a.id === to)
        let description = target ? `${target.name} is now ${money(accountBalances(after, today).find((b) => b.account.id === to)?.balance ?? 0)}` : undefined
        if (target?.purpose === 'tax') {
          const year = Number(today.slice(0, 4))
          const shortfall = estimateTax(after, year, today).shortfall
          const was = estimateTax(s0, year, today).shortfall
          description = `${description} · tax shortfall ${money(was, { whole: true })} → ${money(shortfall, { whole: true })}`
        }
        toast(`${money(amount)} moved to ${target?.name ?? 'account'}`, { description })
      },
      openTaxReserve() {
        const { before, after } = apply({ type: 'openTaxReserve' })
        const account = after.accounts.find((a) => a.purpose === 'tax')!
        if (before !== after) toast('Tax reserve opened', { description: `${account.name} ··${account.last4} · money moved here counts as set aside for tax.` })
        return account.id
      },
      setBudget(categoryId, monthlyLimit) {
        apply({ type: 'setBudget', categoryId, monthlyLimit })
        const label = getCategory(categoryId).label
        toast(monthlyLimit && monthlyLimit > 0 ? `${label} budget set to ${money(monthlyLimit, { whole: true })} a month` : `${label} budget removed`)
      },
      addGoal(goal) {
        apply({ type: 'addGoal', goal })
        toast(`Goal added: ${goal.name}`, { description: `Target ${money(goal.target, { whole: true })}` })
      },
      updateGoal(id, patch) {
        apply({ type: 'updateGoal', id, patch })
        toast('Goal updated')
      },
      deleteGoal(id) {
        const { before } = apply({ type: 'deleteGoal', id })
        toast(`Goal removed: ${before.goals.find((g) => g.id === id)?.name ?? ''}`)
      },
      contributeToGoal(id, amount) {
        const { after } = apply({ type: 'contributeToGoal', id, amount, date: current().today })
        const goal = after.goals.find((g) => g.id === id)
        toast(amount >= 0 ? `${money(amount)} added to ${goal?.name ?? 'goal'}` : `${money(-amount)} taken from ${goal?.name ?? 'goal'}`, {
          description: goal ? `${money(goal.saved, { whole: true })} of ${money(goal.target, { whole: true })} saved` : undefined,
        })
      },
      updateTaxSettings(patch) {
        const { before, after, today } = apply({ type: 'updateTaxSettings', patch })
        const year = Number(today.slice(0, 4))
        const was = estimateTax(before, year, today).estimatedTax
        const now = estimateTax(after, year, today).estimatedTax
        // One toast for a burst of edits (a slider being dragged), updated in place.
        toast('Tax settings updated', {
          id: 'tax-settings',
          description: Math.abs(now - was) >= 1 ? `Tax estimate ${money(was, { whole: true })} → ${money(now, { whole: true })}` : 'Tax estimate unchanged',
        })
      },
      recordTaxPayment(year, quarter, amount, opts) {
        const { after, today } = apply({ type: 'recordTaxPayment', year, quarter, amount, date: opts?.date ?? current().today, accountId: opts?.accountId })
        const q = estimateTax(after, year, today).quarters.find((x) => x.quarter === quarter)
        toast(`Tax payment recorded: Q${quarter} ${year}`, {
          description: `${signedMoney(-amount)}${q ? ` · Q${quarter} ${q.status === 'paid' ? 'now paid' : `${money(Math.max(0, q.amount - q.paid), { whole: true })} still open`}` : ''}`,
        })
      },
      setPeriod(period) {
        apply({ type: 'setPeriod', period })
      },
      completeLesson(id) {
        apply({ type: 'completeLesson', id })
        toast('Lesson completed')
      },
    }
  }
}

/**
 * Holds the demo state for the whole `/demo` area. Renders `fallback` until the
 * browser state is loaded, so server and client markup always match.
 */
export function DemoProvider({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [store] = useState(() => new DemoStore())
  const loaded = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)

  useEffect(() => {
    // `?persona=` is applied on load; drop it so a refresh keeps the persona picked later.
    const url = new URL(window.location.href)
    if (url.searchParams.has('persona')) {
      url.searchParams.delete('persona')
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    }
  }, [])

  useEffect(() => store.connect(), [store])

  const value = useMemo<DemoContextValue | null>(
    () => (loaded ? { state: loaded.state, today: loaded.today, persona: getPersona(loaded.state.personaId), actions: store.actions } : null),
    [loaded, store],
  )

  if (!value) return <>{fallback}</>
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

/** Demo state, today's date, the persona and all actions. Use inside `DemoProvider`. */
export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}

/** True when rendered inside a loaded `DemoProvider`. */
export function useDemoReady(): boolean {
  return useContext(DemoContext) !== null
}
