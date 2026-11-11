'use client'

import { useState } from 'react'

import { Switch } from '@/components/ui/switch'
import { money, pct } from '@/lib/demo/format'
import { useKpis, usePersona, useSubscriptions } from '@/lib/demo/hooks'
import { cn } from '@/lib/utils'

/** Recurring charges with a what-if "cancel" switch on each. */
export function SubscriptionsAudit() {
  const persona = usePersona()
  const subs = useSubscriptions()
  const year = useKpis('last-12-months')
  const [cancelled, setCancelled] = useState<{ persona: string; set: string[] }>({ persona: persona.id, set: [] })
  const [showAll, setShowAll] = useState(false)
  const picked = cancelled.persona === persona.id ? cancelled.set : []

  const active = subs.filter((s) => s.active)
  const monthly = active.reduce((s, x) => s + x.monthlyCost, 0)
  const saving = active.filter((s) => picked.includes(s.merchant)).reduce((s, x) => s + x.yearlyCost, 0)
  const rateAfter = year.income > 0 ? (year.net + saving) / year.income : 0
  const rows = showAll ? active : active.slice(0, 8)

  const toggle = (merchant: string, on: boolean) =>
    setCancelled({ persona: persona.id, set: on ? [...picked, merchant] : picked.filter((m) => m !== merchant) })

  if (!active.length) {
    return <p className="text-muted-foreground">No recurring charges found. The rules look for the same merchant charging a similar amount every month or year.</p>
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0">
        <p className="text-lg text-pretty">
          {active.length} recurring charges cost <span className="font-mono tabular-nums">{money(monthly * 12, { whole: true })}</span> a year.
        </p>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {rows.map((s) => {
            const isCancelled = picked.includes(s.merchant)
            const id = `cancel-${s.merchant.replace(/\W+/g, '-').toLowerCase()}`
            return (
              <li key={s.merchant} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 py-3">
                <div className="min-w-0">
                  <p className={cn('truncate', isCancelled && 'text-muted-foreground line-through decoration-destructive decoration-2')}>{s.merchant}</p>
                  {s.priceChange && (
                    <p className="text-xs text-destructive">
                      price up from {money(s.priceChange.from)}
                    </p>
                  )}
                </div>
                <span className="text-right font-mono text-sm tabular-nums">
                  {money(s.amount)}
                  <span className="text-muted-foreground">/{s.cadence === 'monthly' ? 'mo' : 'yr'}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Switch id={id} checked={isCancelled} onCheckedChange={(on) => toggle(s.merchant, on)} aria-label={`Cancel ${s.merchant} (what-if)`} />
                  <label htmlFor={id} className="hidden text-xs text-muted-foreground sm:inline">
                    Cancel
                  </label>
                </span>
              </li>
            )
          })}
        </ul>
        {active.length > 8 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 text-sm font-medium underline underline-offset-4">
            {showAll ? 'Show fewer' : `Show all ${active.length}`}
          </button>
        )}
      </div>

      <aside aria-live="polite" className="h-fit space-y-2 lg:sticky lg:top-24">
        <p className="text-sm text-muted-foreground">What if you cancelled them?</p>
        {picked.length ? (
          <>
            <p className="font-mono text-3xl font-medium text-success tabular-nums">+{money(saving, { whole: true })}</p>
            <p className="text-sm text-pretty">
              a year back.{year.income > 0 && <> You would keep {pct(rateAfter)} of your income instead of {pct(year.savingsRate)}.</>}
            </p>
            <button type="button" onClick={() => setCancelled({ persona: persona.id, set: [] })} className="text-sm underline underline-offset-4">
              Clear
            </button>
          </>
        ) : (
          <p className="text-sm text-pretty">Flip “Cancel” on a row to see what it frees up in a year.</p>
        )}
        <p className="pt-2 text-xs text-muted-foreground">What-if only: nothing is cancelled.</p>
      </aside>
    </div>
  )
}
