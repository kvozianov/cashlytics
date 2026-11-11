'use client'

import { ChevronDown, CornerDownLeft, Undo2 } from 'lucide-react'
import { useId, useMemo, useRef, useState, type FormEvent } from 'react'

import { CategoryBadge, Money } from '@/components/demo/ui'
import { CategoryPicker } from '@/components/demo/transactions/category-picker'
import { ConfidenceMeter } from '@/components/demo/transactions/confidence'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getCategory } from '@/lib/demo/categories'
import { categorize, needsReview, REVIEW_THRESHOLD } from '@/lib/demo/categorize'
import { isValidISODate } from '@/lib/demo/dates'
import { formatDate, relativeDays } from '@/lib/demo/format'
import { parseQuickAdd, QUICK_ADD_EXAMPLES } from '@/lib/demo/quick-add'
import { everydayAccountId } from '@/lib/demo/reducer'
import { useDemo } from '@/lib/demo/store'
import type { CategoryId, ISODate, Transaction } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

/** Category, confidence and the reason, recalculated on every keystroke. */
function LivePreview({ description, amount, categoryId }: { description: string; amount: number; categoryId?: CategoryId | null }) {
  const { state } = useDemo()
  const result = useMemo(() => categorize(description, amount, state.rules), [description, amount, state.rules])
  if (categoryId) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CategoryBadge categoryId={categoryId} size="sm" />
          <ConfidenceMeter value={1} />
        </div>
        <p className="text-right font-mono text-[11px] text-muted-foreground">Chosen by you</p>
      </div>
    )
  }
  const review = needsReview({ ...result, reviewed: false })
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <CategoryBadge categoryId={result.categoryId} size="sm" />
        <ConfidenceMeter value={result.confidence} />
      </div>
      <p className="text-right font-mono text-[11px] text-muted-foreground">{result.reason}</p>
      {review && (
        <p className="text-right text-[11px] text-warning">
          Under {Math.round(REVIEW_THRESHOLD * 100)}% sure: it will wait in the review queue.
        </p>
      )}
    </div>
  )
}

interface FormState {
  description: string
  amount: string
  direction: 'out' | 'in'
  date: ISODate
  accountId: string
  categoryId: CategoryId | null
  note: string
}

function FullForm({ initial, onSave }: { initial: FormState; onSave: (f: FormState) => void }) {
  const { state, today } = useDemo()
  const [form, setForm] = useState(initial)
  const ids = useId()
  const amount = Number(form.amount.replace(/[$,\s]/g, ''))
  const amountOk = Number.isFinite(amount) && amount > 0
  const dateOk = isValidISODate(form.date) && form.date <= today
  const ok = form.description.trim().length > 0 && amountOk && dateOk
  const signed = amountOk ? (form.direction === 'in' ? amount : -amount) : form.direction === 'in' ? 1 : -1
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ok) return
        onSave(form)
        setForm((f) => ({ ...f, description: '', amount: '', note: '', categoryId: null }))
        document.getElementById(`${ids}-desc`)?.focus()
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${ids}-desc`}>Description</Label>
        <Input id={`${ids}-desc`} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. SQ *BLUE BOTTLE or Rent November" autoComplete="off" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${ids}-amount`}>Amount</Label>
          <div className="flex gap-2">
            <ToggleGroup className="[&>[data-state=on]]:bg-primary! [&>[data-state=on]]:text-primary-foreground!" type="single" variant="outline" value={form.direction} onValueChange={(v) => v && set({ direction: v as 'in' | 'out' })} aria-label="Direction">
              <ToggleGroupItem value="out" aria-label="Money out" className="px-2.5 font-mono">−</ToggleGroupItem>
              <ToggleGroupItem value="in" aria-label="Money in" className="px-2.5 font-mono">+</ToggleGroupItem>
            </ToggleGroup>
            <Input id={`${ids}-amount`} inputMode="decimal" value={form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0.00" className="font-mono" aria-invalid={form.amount !== '' && !amountOk} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ids}-date`}>Date</Label>
          <Input id={`${ids}-date`} type="date" max={today} value={form.date} onChange={(e) => set({ date: e.target.value })} className="font-mono" aria-invalid={!dateOk} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ids}-account`}>Account</Label>
          <Select value={form.accountId} onValueChange={(v) => set({ accountId: v })}>
            <SelectTrigger id={`${ids}-account`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {state.accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} ·{a.last4}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${ids}-cat`}>Category</Label>
          <div className="flex gap-1">
            <CategoryPicker id={`${ids}-cat`} value={form.categoryId} onSelect={(id) => set({ categoryId: id })} placeholder="Automatic" className="min-w-0 flex-1" />
            {form.categoryId && (
              <Button type="button" variant="ghost" size="sm" onClick={() => set({ categoryId: null })}>
                Auto
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${ids}-note`}>Note</Label>
        <Textarea id={`${ids}-note`} rows={2} value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Optional" />
      </div>
      <div className="rounded-md border border-border bg-card p-3">
        <p className="mb-1.5 text-sm text-muted-foreground">Category, as you type</p>
        {form.description.trim() ? (
          <LivePreview description={form.description} amount={signed} categoryId={form.categoryId} />
        ) : (
          <p className="text-xs text-muted-foreground">Start typing a description to see which rule sorts it.</p>
        )}
      </div>
      <Button type="submit" disabled={!ok} className="w-full sm:w-auto">
        Add transaction
      </Button>
    </form>
  )
}

/** One-line quick add with a parsed preview, plus a full form; stays open for adding several in a row. */
export function QuickAddDialog({ open, onOpenChange, initialText = '' }: { open: boolean; onOpenChange: (open: boolean) => void; initialText?: string }) {
  const { state, today, actions } = useDemo()
  const [text, setText] = useState('')
  const [full, setFull] = useState(false)
  const [added, setAdded] = useState<Transaction[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = useMemo(() => parseQuickAdd(text, today), [text, today])
  const live = useMemo(() => new Set(state.transactions.map((t) => t.id)), [state.transactions])
  const [why, setWhy] = useState(false)
  const result = useMemo(() => (parsed ? categorize(parsed.description, parsed.amount, state.rules) : null), [parsed, state.rules])
  const review = result ? needsReview({ ...result, reviewed: false }) : false

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!parsed) return
    const tx = actions.addTransaction({ date: parsed.date, description: parsed.description, amount: parsed.amount })
    setAdded((a) => [tx, ...a].slice(0, 3))
    setText('')
    inputRef.current?.focus()
  }

  // Start fresh each time it opens; resetting on close would flash while it fades out.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setText(initialText)
      setFull(false)
      setAdded([])
    }
  }
  const change = onOpenChange

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="px-5 pt-5 pb-3 text-left sm:px-6">
          <DialogTitle className="font-display text-xl tracking-tight">Add a transaction</DialogTitle>
          <DialogDescription>Type it the way you would say it. Enter adds it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 pb-5 sm:px-6">
          <form onSubmit={save} className="space-y-3">
            <Label htmlFor="quick-add-line" className="sr-only">
              One-line entry
            </Label>
            <div className="relative">
              <Input
                id="quick-add-line"
                ref={inputRef}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="coffee 4.50 yesterday"
                className="h-12 pr-12 font-mono text-base"
                aria-describedby="quick-add-preview"
              />
              <Kbd className="absolute top-1/2 right-3 -translate-y-1/2" aria-hidden="true">
                <CornerDownLeft />
              </Kbd>
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Examples">
              {QUICK_ADD_EXAMPLES.slice(0, 3).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setText(ex)
                    inputRef.current?.focus()
                  }}
                  className="rounded-sm border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>

            <div id="quick-add-preview" aria-live="polite" className="min-h-12 text-[15px]">
              {parsed && result ? (
                <div className="space-y-2">
                  <p className="text-pretty">
                    <span className="font-medium">{parsed.description}</span>
                    <span className="text-muted-foreground"> · </span>
                    <Money value={parsed.amount} />
                    <span className="text-muted-foreground"> · {relativeDays(parsed.date, today)} · </span>
                    {getCategory(result.categoryId).label}
                    {review && <span className="text-sm text-warning"> · will wait for review</span>}{' '}
                    <button
                      type="button"
                      onClick={() => setWhy((w) => !w)}
                      aria-expanded={why}
                      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      {why ? 'hide' : 'why?'}
                    </button>
                  </p>
                  {why && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span>{formatDate(parsed.date, { weekday: true })}</span>
                      <ConfidenceMeter value={result.confidence} />
                      <span className="font-mono text-xs">{result.reason}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {text.trim() ? 'Add an amount, like 4.50, to see how it reads.' : 'A + in front means money in. “yesterday” or “3 nov” work as dates.'}
                </p>
              )}
            </div>
            <Button type="submit" disabled={!parsed} className="w-full">
              Add
            </Button>
          </form>

          {added.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Added just now</p>
              <ul className="divide-y divide-border rounded-md border border-border">
                {added.map((t) => {
                  const gone = !live.has(t.id)
                  return (
                    <li key={t.id} className={cn('flex items-center gap-2 px-3 py-1.5 text-[13px]', gone && 'opacity-50')}>
                      <span className={cn('min-w-0 flex-1 truncate', gone && 'line-through')}>{t.merchant}</span>
                      <CategoryBadge categoryId={t.categoryId} size="sm" iconOnly />
                      <Money value={t.amount} className="text-xs" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={gone}
                        aria-label={`Remove ${t.merchant}`}
                        onClick={() => actions.deleteTransaction(t.id)}
                        className="size-7 text-muted-foreground"
                      >
                        <Undo2 className="size-3.5" />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <Button type="button" variant="ghost" size="sm" className="-ml-2 gap-1.5" aria-expanded={full} onClick={() => setFull((f) => !f)}>
              <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform duration-200', full && 'rotate-180')} />
              {full ? 'Fewer options' : 'More options'}
            </Button>
            {full && (
              <div className="pt-3">
                <FullForm
                  key={parsed ? `${parsed.description}|${parsed.amount}|${parsed.date}` : 'empty'}
                  initial={{
                    description: parsed?.description ?? '',
                    amount: parsed ? String(Math.abs(parsed.amount)) : '',
                    direction: parsed && parsed.amount > 0 ? 'in' : 'out',
                    date: parsed?.date ?? today,
                    accountId: everydayAccountId(state),
                    categoryId: null,
                    note: '',
                  }}
                  onSave={(f) => {
                    const value = Math.abs(Number(f.amount.replace(/[$,\s]/g, '')))
                    const tx = actions.addTransaction({
                      date: f.date,
                      description: f.description.trim(),
                      amount: f.direction === 'in' ? value : -value,
                      accountId: f.accountId,
                      categoryId: f.categoryId ?? undefined,
                      note: f.note.trim() || undefined,
                    })
                    setAdded((a) => [tx, ...a].slice(0, 3))
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
