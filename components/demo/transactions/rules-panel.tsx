'use client'

import { ChevronRight, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Stamp } from '@/components/brand'
import { CategoryBadge } from '@/components/demo/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCategory } from '@/lib/demo/categories'
import { builtInRules, REVIEW_THRESHOLD } from '@/lib/demo/categorize'
import { applyRule } from '@/lib/demo/reducer'
import { useDemo } from '@/lib/demo/store'
import type { CategoryId, RuleMatch } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { CategoryPicker } from './category-picker'

const BUILT_IN = builtInRules()

function Pipeline() {
  const steps = [
    ['Your rules', 'merchants and words you taught it'],
    ['Known merchants', `a list of ${new Set(BUILT_IN.merchants.map((m) => m.merchant)).size} shops and services`],
    ['Keywords', 'words like “rent” or “coffee” in the bank text'],
    ['Nothing matched', 'it waits for you in To review'],
  ]
  return (
    <section className="space-y-3" aria-labelledby="how-sorted">
      <h2 id="how-sorted" className="font-display text-lg font-semibold tracking-tight">
        How a transaction gets its category
      </h2>
      <ol className="space-y-1.5 text-[15px]">
        {steps.map(([title, detail], i) => (
          <li key={title} className="flex gap-3">
            <span className="w-5 shrink-0 font-mono text-sm text-muted-foreground tabular-nums">{i + 1}</span>
            <span>
              {title}
              <span className="text-muted-foreground"> — {detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">
        The first match wins. Anything under {Math.round(REVIEW_THRESHOLD * 100)}% sure is not guessed. Plain rules, no AI model.
      </p>
    </section>
  )
}

function AddRule({ onClose }: { onClose: () => void }) {
  const { state, actions } = useDemo()
  const [pattern, setPattern] = useState('')
  const [match, setMatch] = useState<RuleMatch>('contains')
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null)
  const [added, setAdded] = useState<{ key: number; n: number } | null>(null)
  const preview = useMemo(
    () => (pattern.trim() && categoryId ? applyRule(state.transactions, { id: 'preview', match, pattern: pattern.trim(), categoryId }).changed.length : 0),
    [state.transactions, pattern, match, categoryId],
  )
  const ready = pattern.trim().length >= 2 && categoryId

  return (
    <form
      className="space-y-3 border-t border-border px-4 py-4 sm:px-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ready) return
        const { updated } = actions.addRule({ match, pattern: pattern.trim(), categoryId })
        setAdded({ key: Date.now(), n: updated })
        setPattern('')
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">New rule</p>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,14rem)_auto]">
        <Select value={match} onValueChange={(v) => setMatch(v as RuleMatch)}>
          <SelectTrigger aria-label="Match type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contains">Text contains</SelectItem>
            <SelectItem value="exact">Merchant is</SelectItem>
          </SelectContent>
        </Select>
        <div>
          <Label htmlFor="rule-pattern" className="sr-only">
            Pattern
          </Label>
          <Input id="rule-pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder={match === 'exact' ? 'e.g. Sightglass Coffee' : 'e.g. steamgames'} className="font-mono" />
        </div>
        <CategoryPicker value={categoryId} onSelect={setCategoryId} className="w-full" aria-label="Category for the rule" />
        <Button type="submit" disabled={!ready} className="gap-1.5">
          <Plus aria-hidden="true" className="size-4" /> Add
        </Button>
      </div>
      <div className="flex min-h-9 flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {ready && (
          <span>
            Would re-sort {preview} existing transaction{preview === 1 ? '' : 's'}.
          </span>
        )}
        {added && (
          <Stamp key={added.key} size="sm" tone="success" rotate={-3} subline={`${added.n} re-sorted`}>
            Rule added
          </Stamp>
        )}
      </div>
    </form>
  )
}

function BuiltInTable({ kind, counts }: { kind: 'merchants' | 'keywords'; counts: Map<string, number> }) {
  const [q, setQ] = useState('')
  const [all, setAll] = useState(false)
  const rows = useMemo(() => {
    const list =
      kind === 'merchants'
        ? BUILT_IN.merchants.map((m) => ({ key: m.reason, token: m.match, name: m.merchant, categoryId: m.categoryId, sign: m.sign, confidence: m.confidence }))
        : BUILT_IN.keywords.map((k) => ({ key: k.reason, token: k.keyword, name: '', categoryId: k.categoryId, sign: k.sign, confidence: k.confidence }))
    const needle = q.trim().toLowerCase()
    return list
      .map((r) => ({ ...r, count: counts.get(r.key) ?? 0 }))
      .filter((r) => !needle || r.token.includes(needle) || r.name.toLowerCase().includes(needle) || getCategory(r.categoryId).label.toLowerCase().includes(needle))
      .sort((a, b) => b.count - a.count)
  }, [kind, q, counts])
  const shown = all || q ? rows : rows.slice(0, 10)

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{kind === 'merchants' ? 'Merchant dictionary' : 'Keyword patterns'}</h3>
          <p className="text-[13px] text-muted-foreground">
            Built in, read-only · {rows.length} {kind === 'merchants' ? 'entries' : 'patterns'}
          </p>
        </div>
        <div className="relative w-full sm:w-52">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" aria-label={`Filter ${kind}`} className="h-8 pl-8 text-sm" />
        </div>
      </div>
      <ul className="divide-y divide-border">
        {shown.map((r) => (
          <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_3rem_4.5rem] sm:px-5">
            <p className="min-w-0 truncate font-mono text-xs">
              &quot;{r.token}&quot;
              {r.name && <span className="font-sans text-muted-foreground"> → {r.name}</span>}
              {r.sign && <span className="ml-1.5 rounded-[3px] border border-border px-1 text-[10px] text-muted-foreground">{r.sign === 'in' ? 'money in' : 'money out'}</span>}
            </p>
            <CategoryBadge categoryId={r.categoryId} size="sm" className="col-start-1 row-start-2 justify-self-start sm:col-start-auto sm:row-start-auto" />
            <span className="hidden text-right font-mono text-[11px] text-muted-foreground tabular-nums sm:block">{Math.round(r.confidence * 100)}%</span>
            <span className={cn('col-start-2 row-span-2 row-start-1 text-right font-mono text-xs tabular-nums sm:col-start-auto sm:row-span-1 sm:row-start-auto', r.count ? 'text-foreground' : 'text-muted-foreground/60')}>
              {r.count}
              <span className="sr-only"> matches</span>
            </span>
          </li>
        ))}
        {shown.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted-foreground">Nothing matches “{q}”.</li>}
      </ul>
      {!q && rows.length > 10 && (
        <div className="border-t border-border px-4 py-2 sm:px-5">
          <Button variant="link" size="sm" className="h-7 px-0 text-xs" onClick={() => setAll((a) => !a)}>
            {all ? 'Show the 10 most used' : `Show all ${rows.length}`}
          </Button>
        </div>
      )}
    </div>
  )
}

/** Your rules (editable) and the built-in rule layers (read-only, behind a toggle). */
export function RulesPanel() {
  const { state, actions } = useDemo()
  const [adding, setAdding] = useState(false)
  const [builtIn, setBuiltIn] = useState(false)
  const reasonCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of state.transactions) counts.set(t.reason, (counts.get(t.reason) ?? 0) + 1)
    return counts
  }, [state.transactions])

  return (
    <div className="max-w-3xl space-y-12">
      <Pipeline />

      <section className="space-y-3" aria-labelledby="your-rules">
        <div className="flex items-end justify-between gap-3">
          <h2 id="your-rules" className="font-display text-lg font-semibold tracking-tight">
            Your rules
          </h2>
          {!adding && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
              <Plus aria-hidden="true" className="size-4" /> Add a rule
            </Button>
          )}
        </div>
        <div className="rounded-md border border-border bg-card">
          {state.rules.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No rules yet. Correct a transaction and tick “Always categorise…” to make one.</p>
          ) : (
            <ul className="divide-y divide-border">
              {state.rules.map((rule) => (
                <li key={rule.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 sm:px-5">
                  <p className="min-w-0 flex-1 truncate text-[15px]">
                    <span className="text-muted-foreground">{rule.match === 'exact' ? 'Merchant is ' : 'Text contains '}</span>“{rule.pattern}”
                  </p>
                  <CategoryBadge categoryId={rule.categoryId} size="sm" />
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete rule ${rule.pattern}`} onClick={() => actions.removeRule(rule.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {adding && <AddRule onClose={() => setAdding(false)} />}
        </div>
      </section>

      <section className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground" aria-expanded={builtIn} onClick={() => setBuiltIn((b) => !b)}>
          <ChevronRight aria-hidden="true" className={cn('size-4 transition-transform duration-150', builtIn && 'rotate-90')} />
          {builtIn ? 'Hide built-in rules' : 'Show built-in rules'}
        </Button>
        {builtIn && (
          <div className="grid gap-6">
            <BuiltInTable kind="merchants" counts={reasonCounts} />
            <BuiltInTable kind="keywords" counts={reasonCounts} />
          </div>
        )}
      </section>
    </div>
  )
}
