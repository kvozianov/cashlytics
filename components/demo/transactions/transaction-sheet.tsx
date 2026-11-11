'use client'

import Link from 'next/link'
import { ArrowRight, Check, ChevronRight, FileText, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { MarginNote, Stamp } from '@/components/brand'
import { CategoryBadge, Money } from '@/components/demo/ui'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { getCategory } from '@/lib/demo/categories'
import { needsReview, REVIEW_THRESHOLD } from '@/lib/demo/categorize'
import { formatDate, signedMoney } from '@/lib/demo/format'
import { applyRule } from '@/lib/demo/reducer'
import { useDemo } from '@/lib/demo/store'
import type { CategoryId, Transaction } from '@/lib/demo/types'

import { CategoryPicker } from './category-picker'
import { ConfidenceMeter } from './confidence'
import { LAYER_LABEL, reasonLayer } from './ledger-utils'

const SOURCE: Record<Transaction['source'], string> = {
  bank: 'Bank feed (simulated)',
  manual: 'Added by you',
  import: 'Imported from CSV',
  invoice: 'Created when an invoice was paid',
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-border px-5 py-5">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}

/** How many other transactions a merchant rule would re-sort, using the same code the store runs. */
export function rulePreview(all: readonly Transaction[], tx: Transaction, categoryId: CategoryId): number {
  return applyRule(all, { id: 'preview', match: 'exact', pattern: tx.merchant, categoryId }).changed.filter((id) => id !== tx.id).length
}

function Details({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const { state, actions } = useDemo()
  const [pending, setPending] = useState<CategoryId>(tx.categoryId)
  const [remember, setRemember] = useState(true)
  const [note, setNote] = useState(tx.note ?? '')
  const [applied, setApplied] = useState<{ n: number; key: number; rule: boolean } | null>(null)

  const account = state.accounts.find((a) => a.id === tx.accountId)
  const layer = reasonLayer(tx.reason)
  const review = needsReview(tx)
  const category = getCategory(tx.categoryId)
  const invoice = tx.invoiceId ? state.invoices.find((i) => i.id === tx.invoiceId) : undefined
  const changed = pending !== tx.categoryId
  const preview = useMemo(() => (pending === 'uncategorised' ? 0 : rulePreview(state.transactions, tx, pending)), [state.transactions, tx, pending])
  const canSave = pending !== 'uncategorised' && (changed || (remember && preview > 0) || !tx.reviewed)

  const save = () => {
    const rule = remember
    const n = rule ? preview : 0
    actions.recategorise(tx.id, pending, { createRule: rule })
    setApplied({ n, key: Date.now(), rule })
  }

  return (
    <>
      <SheetHeader className="gap-3 px-5 pt-5 pb-4">
        <p className="text-sm text-muted-foreground">{formatDate(tx.date, { weekday: true })}</p>
        <SheetTitle className="pr-8 font-display text-2xl leading-tight font-semibold tracking-tight">{tx.merchant}</SheetTitle>
        <SheetDescription className="sr-only">Details, category and notes for this transaction.</SheetDescription>
        <Money value={tx.amount} className="text-3xl font-medium tracking-tight" />
      </SheetHeader>

      <Block title="Why this category">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge categoryId={tx.categoryId} />
          <ConfidenceMeter value={tx.confidence} />
        </div>
        <p className="text-sm text-muted-foreground">
          {LAYER_LABEL[layer]}: <span className="font-mono text-[13px] text-foreground">{tx.reason}</span>
        </p>
        {review && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MarginNote still arrow="up" tone="signal" size="sm" rotate={-2}>
              under {Math.round(REVIEW_THRESHOLD * 100)}% sure, so it waits for you
            </MarginNote>
            {tx.categoryId !== 'uncategorised' && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  actions.confirmCategory(tx.id)
                  toast(`Confirmed: ${category.label}`, { description: 'Removed from the review queue.' })
                }}
              >
                <Check aria-hidden="true" className="size-3.5" />
                Looks right
              </Button>
            )}
          </div>
        )}
      </Block>

      <Block title="Change category">
        <CategoryPicker id="sheet-category" value={pending} onSelect={setPending} className="w-full" aria-label="Category" />
        <div className="flex items-start gap-2.5">
          <Checkbox id="sheet-remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} className="mt-0.5" />
          <Label htmlFor="sheet-remember" className="block text-sm leading-snug font-normal">
            Always categorise <strong className="font-medium">{tx.merchant}</strong> as{' '}
            <strong className="font-medium">{pending === 'uncategorised' ? '…' : getCategory(pending).label}</strong>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {preview > 0
                ? `Also re-sorts ${preview} earlier ${preview === 1 ? 'one' : 'ones'}.`
                : 'Future ones will follow.'}
            </span>
          </Label>
        </div>
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3">
          <Button onClick={save} disabled={!canSave}>
            {changed ? 'Save category' : remember ? 'Save rule' : 'Keep category'}
          </Button>
          {applied && (
            <Stamp key={applied.key} size="sm" tone={applied.rule ? 'success' : 'ink'} rotate={-3} subline={applied.rule ? `${applied.n} re-sorted` : undefined}>
              {applied.rule ? 'Rule saved' : 'Category set'}
            </Stamp>
          )}
        </div>
      </Block>

      <Block title="Note">
        <Label htmlFor="sheet-note" className="sr-only">
          Note
        </Label>
        <Textarea id="sheet-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note, e.g. who it was for" rows={2} className="bg-card" />
        <Button size="sm" variant="outline" disabled={note === (tx.note ?? '')} onClick={() => actions.updateTransaction(tx.id, { note: note.trim() || undefined })}>
          Save note
        </Button>
      </Block>

      <details className="group border-t border-border px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronRight aria-hidden="true" className="size-4 transition-transform duration-150 group-open:rotate-90" />
          More: bank text, account, tax
        </summary>
        <div className="space-y-4 pt-3">
          <div className="space-y-2">
            <p className="rounded-sm border border-border bg-muted/50 px-3 py-2 font-mono text-xs break-all">{tx.description}</p>
            <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-[13px]">
              <dt className="text-muted-foreground">Account</dt>
              <dd>
                {account?.name ?? tx.accountId}
                {account && <span className="font-mono text-xs text-muted-foreground"> ·{account.last4}</span>}
              </dd>
              <dt className="text-muted-foreground">Source</dt>
              <dd>{SOURCE[tx.source]}</dd>
              {invoice && (
                <>
                  <dt className="text-muted-foreground">Invoice</dt>
                  <dd>
                    <Link href="/demo/invoices" className="inline-flex items-center gap-1 underline underline-offset-4">
                      <FileText aria-hidden="true" className="size-3.5" />
                      {invoice.number}
                    </Link>
                  </dd>
                </>
              )}
            </dl>
          </div>
          <div className="space-y-2">
            <p className="text-[13px] text-pretty">
              {category.kind === 'income'
                ? category.taxableByDefault
                  ? `${category.label} counts as taxable income in the estimate.`
                  : `${category.label} is not counted as taxable income in the estimate.`
                : category.deductibleByDefault
                  ? `${category.label} is a deductible business cost, so it lowers the tax estimate.`
                  : `${category.label} is not deductible.`}{' '}
              <span className="text-muted-foreground">Set by the category; change the category to change it.</span>
            </p>
            <Link href="/demo/tax" className="inline-flex items-center gap-1 text-[13px] underline underline-offset-4">
              See the tax estimate <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </div>
      </details>

      <div className="border-t border-border px-5 py-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 aria-hidden="true" className="size-3.5" />
              Delete transaction
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {tx.merchant} {signedMoney(tx.amount)}?</AlertDialogTitle>
              <AlertDialogDescription>
                {invoice
                  ? `It is the payment for invoice ${invoice.number}, which goes back to unpaid. Income and the tax estimate change with it.`
                  : 'Balances, totals and the tax estimate are recalculated without it. Reset the demo to bring it back.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  onClose()
                  actions.deleteTransaction(tx.id)
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}

/** Side sheet for one transaction (`?tx=<id>`). */
export function TransactionSheet({ txId, onClose }: { txId: string | null; onClose: () => void }) {
  const { state } = useDemo()
  const tx = txId ? state.transactions.find((t) => t.id === txId) : undefined
  return (
    <Sheet open={!!tx} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-md">
        {tx && <Details key={tx.id} tx={tx} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}
