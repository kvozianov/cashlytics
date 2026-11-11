'use client'

import { Download, FileUp, Plus, SearchX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useDemoShell } from '@/components/demo/shell'
import { EmptyState, PageHeader } from '@/components/demo/ui'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toCsv } from '@/lib/demo/csv'
import { monthKey } from '@/lib/demo/dates'
import { useReviewQueue } from '@/lib/demo/hooks'
import { useDemo } from '@/lib/demo/store'
import type { CategoryId } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { BulkBar } from './bulk-bar'
import { ImportDialog } from './import-dialog'
import { Ledger } from './ledger'
import { activeFilterCount, filterTransactions, rangeFor, type LedgerFilters, type View } from './ledger-utils'
import { ReviewQueue } from './review-queue'
import { RulesPanel } from './rules-panel'
import { Toolbar } from './toolbar'
import { TransactionSheet } from './transaction-sheet'
import { useLedgerState } from './use-ledger-state'

const TAB =
  'flex-none rounded-none border-0 border-b-2 border-transparent px-3 pt-1 pb-2.5 text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent'

function Count({ n, tone }: { n: number; tone?: 'warn' }) {
  return (
    <span
      className={cn(
        'rounded-sm border px-1.5 font-mono text-[11px] leading-5 tabular-nums',
        tone === 'warn' && n > 0 ? 'border-warning/40 text-warning' : 'border-border text-muted-foreground',
      )}
    >
      {n.toLocaleString('en-US')}
    </span>
  )
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function TransactionsPage() {
  const { state, today, actions } = useDemo()
  const { openQuickAdd } = useDemoShell()
  const { ui, search, setFilters, resetFilters, setView, setPage, openTx } = useLedgerState()
  const queue = useReviewQueue()
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [anchor, setAnchor] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [showBankText, setShowBankText] = useState(false)
  const { filters, view, page } = ui

  // `?new=1` opens the add dialog (links from elsewhere in the demo).
  useEffect(() => {
    if (new URLSearchParams(search).get('new') === '1') openQuickAdd()
  }, [search, openQuickAdd])

  const range = useMemo(() => rangeFor(filters.range, state.period, today), [filters.range, state.period, today])
  const rows = useMemo(() => filterTransactions(state.transactions, filters, range), [state.transactions, filters, range])
  const months = useMemo(() => [...new Set(state.transactions.map((t) => monthKey(t.date)))].sort().reverse(), [state.transactions])
  const liveSelected = useMemo(() => {
    const ids = new Set(state.transactions.map((t) => t.id))
    return new Set([...selected].filter((id) => ids.has(id)))
  }, [selected, state.transactions])
  const selectedTx = useMemo(() => state.transactions.filter((t) => liveSelected.has(t.id)), [state.transactions, liveSelected])

  const updateFilters = useCallback(
    (patch: Partial<LedgerFilters>) => {
      setFilters(patch)
      setSelected(new Set())
    },
    [setFilters],
  )
  const clearFilters = useCallback(() => {
    resetFilters()
    setSelected(new Set())
  }, [resetFilters])

  const toggle = useCallback(
    (id: string, extend: boolean) => {
      setSelected((current) => {
        const next = new Set(current)
        if (extend && anchor) {
          const a = rows.findIndex((t) => t.id === anchor)
          const b = rows.findIndex((t) => t.id === id)
          if (a >= 0 && b >= 0) {
            for (const t of rows.slice(Math.min(a, b), Math.max(a, b) + 1)) next.add(t.id)
            return next
          }
        }
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      setAnchor(id)
    },
    [anchor, rows],
  )

  const exportCsv = () => {
    const name = `cashlytics-transactions-${today}.csv`
    download(name, toCsv(rows, state.accounts))
    toast(`Exported ${rows.length.toLocaleString('en-US')} transactions`, { description: `${name}, built in this browser from the current filter.` })
  }

  const grouped = filters.sort === 'newest' || filters.sort === 'oldest'
  const filtered = activeFilterCount(filters) > 0 || filters.q.trim() !== ''
  const stopSelecting = () => {
    setSelecting(false)
    setSelected(new Set())
  }

  return (
    <div className="space-y-8 [--ledger-top:var(--demo-topbar-h)]">
      <PageHeader
        eyebrow="02 — Manage"
        title="Transactions"
        description="Every transaction, sorted automatically. Click one to see why."
        actions={
          <>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setImportOpen(true)}>
              <FileUp aria-hidden="true" className="size-4" /> Import
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={exportCsv} disabled={rows.length === 0}>
              <Download aria-hidden="true" className="size-4" /> Export
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => openQuickAdd()}>
              <Plus aria-hidden="true" className="size-4" /> Add
            </Button>
          </>
        }
      />

      <Tabs value={view} onValueChange={(v) => setView(v as View)} className="gap-6">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="ledger" className={TAB}>
            All
          </TabsTrigger>
          <TabsTrigger value="review" className={TAB}>
            To review {queue.length > 0 && <Count n={queue.length} tone="warn" />}
          </TabsTrigger>
          <TabsTrigger value="rules" className={TAB}>
            Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-4">
          <Toolbar
            filters={filters}
            setFilters={updateFilters}
            resetFilters={clearFilters}
            period={state.period}
            months={months}
            accounts={state.accounts}
            count={rows.length}
            showBankText={showBankText}
            setShowBankText={setShowBankText}
          />

          {rows.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={filtered ? 'Nothing matches these filters' : 'No transactions in this period'}
              description={filtered ? 'Try fewer filters or a longer period.' : 'Pick another period, or add or import a few.'}
              action={
                filters.range !== 'all'
                  ? { label: `Search all ${months.length} months`, onClick: () => updateFilters({ range: 'all' }) }
                  : { label: 'Clear filters', onClick: clearFilters }
              }
              className="bg-card"
            />
          ) : (
            <>
              {!selecting && (
                <div className="-mb-2 flex justify-end">
                  <Button variant="link" size="sm" className="h-7 px-0 text-xs text-muted-foreground" onClick={() => setSelecting(true)}>
                    Select several
                  </Button>
                </div>
              )}
              <Ledger
                rows={rows}
                page={page}
                onPage={setPage}
                grouped={grouped}
                selecting={selecting}
                showBankText={showBankText}
                selected={liveSelected}
                activeId={ui.tx}
                onToggle={toggle}
                onOpen={openTx}
              />
            </>
          )}

          {selecting && (
            <BulkBar
              count={liveSelected.size}
              net={selectedTx.reduce((s, t) => s + t.amount, 0)}
              linkedInvoices={selectedTx.filter((t) => t.invoiceId).length}
              allMatching={rows.length}
              onSelectAll={() => setSelected(new Set(rows.map((t) => t.id)))}
              onDone={stopSelecting}
              onCategory={(id: CategoryId) => {
                actions.recategoriseMany([...liveSelected], id)
                setSelected(new Set())
              }}
              onDelete={() => {
                actions.deleteTransactions([...liveSelected])
                setSelected(new Set())
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="review">
          <ReviewQueue onDone={() => setView('ledger')} onShowRules={() => setView('rules')} />
        </TabsContent>

        <TabsContent value="rules">
          <RulesPanel />
        </TabsContent>
      </Tabs>

      <TransactionSheet txId={ui.tx} onClose={() => openTx(null)} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
