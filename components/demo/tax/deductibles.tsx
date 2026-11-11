'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { CategoryBadge } from '@/components/demo/ui'
import { Switch } from '@/components/ui/switch'
import { getCategory } from '@/lib/demo/categories'
import { money } from '@/lib/demo/format'
import { useDemo } from '@/lib/demo/store'
import { marginalRate, type TaxEstimate } from '@/lib/demo/tax'
import type { CategoryId, TaxSettings } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { deductibleRows, taxSavedByDeductions } from './model'

/** Business costs by category with a deductible switch each, and what the deductions save. */
export function Deductibles({ estimate, settings, onCommit }: { estimate: TaxEstimate; settings: TaxSettings; onCommit: (patch: Partial<TaxSettings>) => void }) {
  const { state, today } = useDemo()
  const rows = useMemo(() => deductibleRows({ transactions: state.transactions, taxSettings: settings }, estimate.year, today), [state.transactions, settings, estimate.year, today])
  const saved = taxSavedByDeductions(estimate, settings)
  const rate = marginalRate(estimate.base, settings)

  const toggle = (id: CategoryId, on: boolean) => {
    const overrides = { ...(settings.deductibleOverrides ?? {}) }
    if (on === getCategory(id).deductibleByDefault) delete overrides[id]
    else overrides[id] = on
    onCommit({ deductibleOverrides: overrides })
  }

  return (
    <section id="deductibles" aria-labelledby="deductibles-title" className="scroll-mt-40 sm:scroll-mt-28 rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div>
          <h2 id="deductibles-title" className="text-sm font-semibold tracking-tight">
            Deductible costs, {estimate.year}
          </h2>
          <p className="text-[13px] text-muted-foreground">Switch a category off if it was not really for the work. Everything recomputes.</p>
        </div>
        <p className="text-right">
          <span className="block font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Tax saved</span>
          <span className="font-mono text-xl font-medium text-success tabular-nums">{money(saved, { whole: true })}</span>
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-[13.5px] text-pretty text-muted-foreground sm:px-6">
          No business costs recorded this year, so nothing reduces the taxable income. Costs you buy for the work (software, equipment, a course) can go in{' '}
          <Link href="/demo/transactions" className="underline underline-offset-4">
            Transactions
          </Link>{' '}
          under a business category.
        </p>
      ) : (
        <ul className="divide-y divide-dashed divide-border px-4 sm:px-6">
          {rows.map((r) => (
            <li key={r.categoryId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_6.5rem_auto]">
              <div className="col-start-1 row-start-1 flex min-w-0 items-baseline gap-2">
                <CategoryBadge categoryId={r.categoryId} size="sm" />
                <span className="hidden text-[12px] text-muted-foreground sm:inline">{r.count}×</span>
                <span aria-hidden="true" className="ldr-leader" />
                <span className={cn('font-mono text-[13px] tabular-nums', !r.deductible && 'text-muted-foreground line-through decoration-1')}>{money(r.total, { whole: true })}</span>
              </div>
              <span className={cn('col-start-1 row-start-2 font-mono text-[12.5px] tabular-nums sm:col-start-2 sm:row-start-1 sm:text-right', r.deductible ? 'text-success' : 'text-muted-foreground')}>
                {r.deductible ? `saves ${money(r.total * rate, { whole: true })}` : 'not counted'}
              </span>
              <Switch
                className="col-start-2 row-span-2 row-start-1 sm:col-start-3 sm:row-span-1"
                checked={r.deductible}
                onCheckedChange={(on) => toggle(r.categoryId, on)}
                aria-label={`Count ${getCategory(r.categoryId).label} as deductible`}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-border px-4 py-3 text-[12.5px] text-muted-foreground sm:px-6">
        A deduction saves the tax rate, not the whole cost: {money(100)} of costs at {Math.round(rate * 100)}% saves {money(100 * rate)}.{' '}
        <Link href="/demo/learn?lesson=deductible" className="underline underline-offset-4">
          Two-minute lesson
        </Link>
      </p>
    </section>
  )
}
