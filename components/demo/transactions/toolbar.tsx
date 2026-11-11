'use client'

import { ListFilter, Search, Tags, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PERIODS } from '@/lib/demo/analytics'
import { getCategory } from '@/lib/demo/categories'
import { formatMonth } from '@/lib/demo/format'
import type { Account, CategoryId, MonthKey, Period } from '@/lib/demo/types'

import { CategoryPicker } from './category-picker'
import { type FlowType, type LedgerFilters, type SortKey } from './ledger-utils'

const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  largest: 'Largest amount',
  smallest: 'Smallest amount',
}

const ON = '[&>[data-state=on]]:bg-primary! [&>[data-state=on]]:text-primary-foreground!'

interface ToolbarProps {
  filters: LedgerFilters
  setFilters: (patch: Partial<LedgerFilters>) => void
  resetFilters: () => void
  period: Period
  months: MonthKey[]
  accounts: Account[]
  count: number
  showBankText: boolean
  setShowBankText: (v: boolean) => void
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-card pr-0.5 pl-2 text-xs">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X aria-hidden="true" className="size-3" />
      </button>
    </span>
  )
}

/** Search, period and category up front; everything else behind one Filters button. */
export function Toolbar({ filters, setFilters, resetFilters, period, months, accounts, count, showBankText, setShowBankText }: ToolbarProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? 'Period'
  const extra =
    (filters.type !== 'all' ? 1 : 0) +
    (filters.group ? 1 : 0) +
    (filters.account ? 1 : 0) +
    (filters.min !== null || filters.max !== null ? 1 : 0) +
    (filters.unreviewed ? 1 : 0) +
    (filters.sort !== 'newest' ? 1 : 0) +
    (showBankText ? 1 : 0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      if (document.querySelector('[role="dialog"]')) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleCategory = (id: CategoryId) =>
    setFilters({ categories: filters.categories.includes(id) ? filters.categories.filter((c) => c !== id) : [...filters.categories, id] })

  const chips: { key: string; label: string; remove: () => void }[] = []
  if (filters.type !== 'all') chips.push({ key: 'type', label: filters.type === 'in' ? 'Money in' : 'Money out', remove: () => setFilters({ type: 'all' }) })
  for (const c of filters.categories) chips.push({ key: `c-${c}`, label: getCategory(c).label, remove: () => toggleCategory(c) })
  if (filters.group) chips.push({ key: 'group', label: filters.group === 'business' ? 'Business' : 'Personal', remove: () => setFilters({ group: null }) })
  if (filters.account)
    chips.push({ key: 'account', label: accounts.find((a) => a.id === filters.account)?.name ?? filters.account, remove: () => setFilters({ account: null }) })
  if (filters.min !== null || filters.max !== null)
    chips.push({
      key: 'amount',
      label: filters.min !== null && filters.max !== null ? `$${filters.min}–$${filters.max}` : filters.min !== null ? `≥ $${filters.min}` : `≤ $${filters.max}`,
      remove: () => setFilters({ min: null, max: null }),
    })
  if (filters.unreviewed) chips.push({ key: 'unreviewed', label: 'Needs review', remove: () => setFilters({ unreviewed: false }) })
  const searching = filters.q.trim() !== ''

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 basis-full sm:basis-auto sm:flex-[1_1_16rem]">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
            placeholder="Search"
            aria-label="Search transactions by merchant, bank text or amount"
            className="h-9 bg-card pl-9"
          />
        </div>

        <Select value={filters.range} onValueChange={(v) => setFilters({ range: v })}>
          <SelectTrigger className="h-9 min-w-0 flex-1 sm:flex-none bg-card sm:w-44" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="period">{periodLabel}</SelectItem>
            <SelectItem value="all">All {months.length} months</SelectItem>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Month</SelectLabel>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMonth(m, { long: true })}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <CategoryPicker
          values={filters.categories}
          onSelect={toggleCategory}
          className="h-9 min-w-0 flex-1 sm:flex-none bg-card sm:w-auto"
          includeUncategorised
          aria-label="Filter by category"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Tags aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Category</span>
            {filters.categories.length > 0 && <span className="rounded-sm bg-primary px-1.5 font-mono text-[11px] text-primary-foreground">{filters.categories.length}</span>}
          </span>
        </CategoryPicker>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" aria-label="Filters" className="h-9 shrink-0 gap-2 bg-card">
              <ListFilter aria-hidden="true" className="size-4 text-muted-foreground" />
              <span className="hidden sm:inline">Filters</span>
              {extra > 0 && <span className="rounded-sm bg-primary px-1.5 font-mono text-[11px] text-primary-foreground">{extra}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Direction</p>
              <ToggleGroup type="single" variant="outline" value={filters.type} onValueChange={(v) => v && setFilters({ type: v as FlowType })} className={`w-full ${ON}`}>
                <ToggleGroupItem value="all" className="flex-1">All</ToggleGroupItem>
                <ToggleGroupItem value="in" className="flex-1">Money in</ToggleGroupItem>
                <ToggleGroupItem value="out" className="flex-1">Money out</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Category group</p>
              <ToggleGroup
                type="single"
                variant="outline"
                value={filters.group ?? 'any'}
                onValueChange={(v) => v && setFilters({ group: v === 'any' ? null : (v as 'business' | 'personal') })}
                className={`w-full ${ON}`}
              >
                <ToggleGroupItem value="any" className="flex-1">Any</ToggleGroupItem>
                <ToggleGroupItem value="business" className="flex-1">Business</ToggleGroupItem>
                <ToggleGroupItem value="personal" className="flex-1">Personal</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="filter-account" className="text-xs font-medium text-muted-foreground">
                  Account
                </Label>
                <Select value={filters.account ?? 'any'} onValueChange={(v) => setFilters({ account: v === 'any' ? null : v })}>
                  <SelectTrigger id="filter-account" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All accounts</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filter-sort" className="text-xs font-medium text-muted-foreground">
                  Sort
                </Label>
                <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v as SortKey })}>
                  <SelectTrigger id="filter-sort" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {SORT_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <fieldset className="space-y-1.5">
              <legend className="text-xs font-medium text-muted-foreground">Amount, either direction</legend>
              <div className="flex items-center gap-2">
                <Input
                  inputMode="decimal"
                  aria-label="Minimum amount"
                  placeholder="Min $"
                  value={filters.min ?? ''}
                  onChange={(e) => setFilters({ min: e.target.value === '' || Number.isNaN(Number(e.target.value)) ? null : Math.abs(Number(e.target.value)) })}
                  className="font-mono"
                />
                <span aria-hidden="true" className="text-muted-foreground">
                  –
                </span>
                <Input
                  inputMode="decimal"
                  aria-label="Maximum amount"
                  placeholder="Max $"
                  value={filters.max ?? ''}
                  onChange={(e) => setFilters({ max: e.target.value === '' || Number.isNaN(Number(e.target.value)) ? null : Math.abs(Number(e.target.value)) })}
                  className="font-mono"
                />
              </div>
            </fieldset>
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="filter-review" className="text-sm font-normal">
                  Only items that need review
                </Label>
                <Switch id="filter-review" checked={filters.unreviewed} onCheckedChange={(v) => setFilters({ unreviewed: v })} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="show-bank-text" className="block text-sm leading-snug font-normal">
                  Show bank text
                  <span className="block text-xs text-muted-foreground">The raw line the categoriser reads</span>
                </Label>
                <Switch id="show-bank-text" checked={showBankText} onCheckedChange={setShowBankText} />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {(chips.length > 0 || searching) && (
        <div className="flex flex-wrap items-center gap-1.5" aria-live="polite">
          <span className="mr-1 text-sm text-muted-foreground">
            {count.toLocaleString('en-US')} {count === 1 ? 'match' : 'matches'}
          </span>
          {chips.map((c) => (
            <Chip key={c.key} label={c.label} onRemove={c.remove} />
          ))}
          <Button variant="link" size="sm" className="h-7 px-1.5 text-xs" onClick={resetFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
