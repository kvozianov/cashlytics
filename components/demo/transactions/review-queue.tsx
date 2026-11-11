'use client'

import { SkipForward, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { MarginNote, Odometer, Stamp } from '@/components/brand'
import { CategoryIcon, Money } from '@/components/demo/ui'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { categoryColor, getCategory } from '@/lib/demo/categories'
import { formatDate } from '@/lib/demo/format'
import { useHealthScore, useReviewQueue } from '@/lib/demo/hooks'
import { useDemo } from '@/lib/demo/store'
import type { CategoryId, DemoState } from '@/lib/demo/types'

import { CategoryPicker } from './category-picker'
import { rankCategories, suggestionsFor } from './ledger-utils'
import { rulePreview } from './transaction-sheet'

interface Step {
  snapshot: DemoState
  merchant: string
  rule: boolean
}

interface Result {
  key: number
  merchant: string
  categoryId: CategoryId
  rule: boolean
  others: number
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.getAttribute('role') === 'combobox')
}

/** One low-confidence transaction at a time, sorted from the keyboard. */
export function ReviewQueue({ onDone, onShowRules }: { onDone: () => void; onShowRules: () => void }) {
  const { state, actions } = useDemo()
  const queue = useReviewQueue()
  const health = useHealthScore()
  const [startCount] = useState(queue.length)
  const [startHealth] = useState(health.score)
  const [skipped, setSkipped] = useState<string[]>([])
  const [history, setHistory] = useState<Step[]>([])
  const [remember, setRemember] = useState(true)
  const [result, setResult] = useState<Result | null>(null)
  const [rulesSaved, setRulesSaved] = useState(0)

  const ordered = useMemo(() => {
    const skip = new Set(skipped)
    return [...queue.filter((t) => !skip.has(t.id)), ...skipped.map((id) => queue.find((t) => t.id === id)).filter((t) => t !== undefined)]
  }, [queue, skipped])
  const tx = ordered[0]
  const ranked = useMemo(() => rankCategories(state.transactions), [state.transactions])
  const suggestions = useMemo(() => (tx ? suggestionsFor(tx, state.transactions, ranked) : []), [tx, state.transactions, ranked])
  const total = Math.max(startCount, queue.length)
  const done = total - queue.length
  const others = useCallback((cat: CategoryId) => (tx ? rulePreview(state.transactions, tx, cat) : 0), [tx, state.transactions])
  const sameMerchant = useMemo(() => (tx ? queue.filter((t) => t.merchant === tx.merchant && t.id !== tx.id).length : 0), [queue, tx])

  const pick = useCallback(
    (categoryId: CategoryId) => {
      if (!tx) return
      const n = remember ? others(categoryId) : 0
      setHistory((h) => [...h.slice(-19), { snapshot: state, merchant: tx.merchant, rule: remember }])
      if (remember) {
        actions.recategorise(tx.id, categoryId, { createRule: true })
        setRulesSaved((r) => r + 1)
      } else if (categoryId === tx.categoryId) {
        actions.confirmCategory(tx.id)
      } else {
        actions.recategorise(tx.id, categoryId)
      }
      setSkipped((s) => s.filter((id) => id !== tx.id))
      setResult({ key: Date.now(), merchant: tx.merchant, categoryId, rule: remember, others: n })
    },
    [tx, remember, others, state, actions],
  )

  const skip = useCallback(() => {
    if (!tx || ordered.length < 2) return
    setSkipped((s) => [...s.filter((id) => id !== tx.id), tx.id])
  }, [tx, ordered.length])

  const undo = useCallback(() => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    if (last.rule) setRulesSaved((r) => Math.max(0, r - 1))
    actions.restore(last.snapshot, `Undone: ${last.merchant}`)
    setResult(null)
  }, [history, actions])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (document.querySelector('[role="dialog"], [data-slot="popover-content"], [data-slot="select-content"]')) return
      const k = e.key.toLowerCase()
      if (/^[1-5]$/.test(k) && suggestions[Number(k) - 1]) {
        e.preventDefault()
        pick(suggestions[Number(k) - 1])
      } else if (k === 's') {
        e.preventDefault()
        skip()
      } else if (k === 'u') {
        e.preventDefault()
        undo()
      } else if (k === 'r') {
        e.preventDefault()
        setRemember((r) => !r)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [suggestions, pick, skip, undo])

  const healthDelta = health.score - startHealth
  const healthLine =
    healthDelta !== 0 ? (
      <p className="text-sm text-muted-foreground">
        Health score{' '}
        <span className="font-mono tabular-nums">
          {startHealth} → <Odometer value={health.score} rollOnMount={false} />
        </span>
      </p>
    ) : null

  if (!tx) {
    return (
      <div className="flex max-w-2xl flex-col items-start gap-6 py-6">
        <Stamp size="lg" tone="success" rotate={-4}>
          All clear
        </Stamp>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Nothing waiting for review</h2>
          <p className="text-pretty text-muted-foreground">
            {done > 0
              ? `You sorted ${done} transaction${done === 1 ? '' : 's'}${rulesSaved ? `, and the ${rulesSaved === 1 ? 'rule you saved sorts' : `${rulesSaved} rules you saved sort`} those merchants from now on` : ''}.`
              : 'When the rules are unsure about a new transaction, it will wait here for you.'}
          </p>
          {healthLine}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onDone}>Back to all transactions</Button>
          <Button variant="ghost" onClick={onShowRules}>
            See your rules
          </Button>
          {history.length > 0 && (
            <Button variant="ghost" onClick={undo} className="gap-1.5">
              <Undo2 aria-hidden="true" className="size-4" /> Undo last
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="space-y-2" aria-live="polite">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">{done}</span> of {total} sorted
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Review progress">
          <div className="h-full bg-foreground transition-[width] duration-300 ease-out" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
        {healthLine}
      </div>

      <article key={tx.id} className="animate-in fade-in-0 slide-in-from-bottom-1 rounded-md border border-border bg-card duration-200" aria-label={`Review ${tx.merchant}`}>
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-5 pt-5 pb-4 sm:px-6">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">{formatDate(tx.date, { weekday: true })}</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight break-words">{tx.merchant}</h2>
          </div>
          <Money value={tx.amount} className="text-2xl font-medium" />
        </header>
        <div className="space-y-2 px-5 pb-5 sm:px-6">
          <p className="text-sm text-pretty text-muted-foreground">
            Best guess <span className="text-foreground">{getCategory(tx.categoryId).label}</span>, only {Math.round(tx.confidence * 100)}% sure.{' '}
            <span className="font-mono text-xs">{tx.reason}</span>
          </p>
          {sameMerchant > 0 && (
            <MarginNote still arrow="none" tone="signal" size="sm" rotate={-1.5}>
              {sameMerchant} more from {tx.merchant} {sameMerchant === 1 ? 'is' : 'are'} waiting too
            </MarginNote>
          )}
        </div>

        <div className="space-y-4 border-t border-border px-5 py-5 sm:px-6">
          <p className="text-sm font-medium">Which category is it?</p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((id, i) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => pick(id)}
                  className="flex w-full items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 text-left text-sm transition-colors hover:border-foreground/50 hover:bg-accent/30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                >
                  <Kbd className="hidden bg-card font-mono sm:inline-flex">{i + 1}</Kbd>
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(id) }} />
                  <CategoryIcon categoryId={id} className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{getCategory(id).label}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CategoryPicker onSelect={pick} className="h-9" aria-label="Choose another category">
              <span>Something else…</span>
            </CategoryPicker>
            <div className="flex items-center gap-2">
              <Switch id="review-remember" checked={remember} onCheckedChange={setRemember} />
              <Label htmlFor="review-remember" className="text-sm font-normal">
                Remember for {tx.merchant}
              </Label>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={skip} disabled={ordered.length < 2} className="gap-1.5">
            <SkipForward aria-hidden="true" className="size-3.5" /> Skip
          </Button>
          <Button variant="ghost" size="sm" onClick={undo} disabled={history.length === 0} className="gap-1.5">
            <Undo2 aria-hidden="true" className="size-3.5" /> Undo
          </Button>
          <p className="ml-auto hidden text-xs text-muted-foreground sm:block">
            Keys: <Kbd>1</Kbd>–<Kbd>5</Kbd> pick · <Kbd>S</Kbd> skip · <Kbd>U</Kbd> undo · <Kbd>R</Kbd> remember
          </p>
        </footer>
      </article>

      <div className="flex min-h-14 items-center gap-4" aria-live="polite">
        {result && (
          <>
            <Stamp key={result.key} size="sm" tone={result.rule ? 'success' : 'ink'} rotate={-3}>
              {result.rule ? 'Rule saved' : 'Sorted'}
            </Stamp>
            <p className="text-sm text-pretty text-muted-foreground">
              {result.merchant} → {getCategory(result.categoryId).label}
              {result.rule && result.others ? `, plus ${result.others} earlier ${result.others === 1 ? 'one' : 'ones'} re-sorted.` : '.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
