'use client'

import { ChevronRight, FileUp, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import { CategoryBadge, Money } from '@/components/demo/ui'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { categorize, needsReview } from '@/lib/demo/categorize'
import { parseStatementCsv, sampleStatement, splitCsvLine } from '@/lib/demo/csv'
import { formatDate } from '@/lib/demo/format'
import { everydayAccountId } from '@/lib/demo/reducer'
import { useDemo } from '@/lib/demo/store'
import { cn } from '@/lib/utils'


const DELIMITER_NAME = { ',': 'comma', ';': 'semicolon', '\t': 'tab' } as const

/** Paste or drop a bank CSV, check what the parser and categoriser make of it, import the rows you pick. */
export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { state, today, actions } = useDemo()
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [excluded, setExcluded] = useState<Set<number>>(new Set())
  const [accountId, setAccountId] = useState(() => everydayAccountId(state))
  const [dragging, setDragging] = useState(false)
  const [pasting, setPasting] = useState(false)
  const [showRows, setShowRows] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => (text.trim() ? parseStatementCsv(text) : null), [text])
  const existing = useMemo(() => new Set(state.transactions.map((t) => `${t.date}|${t.amount.toFixed(2)}|${t.description.toLowerCase()}`)), [state.transactions])
  const header = useMemo(() => {
    if (!parsed) return []
    const first = text.split(/\r?\n/).find((l) => l.trim()) ?? ''
    const cells = splitCsvLine(first, parsed.delimiter)
    return parsed.rows[0]?.line === 1 ? cells.map((_, i) => `column ${i + 1}`) : cells
  }, [parsed, text])
  const preview = useMemo(
    () =>
      (parsed?.rows ?? []).map((r) => {
        const c = categorize(r.description, r.amount, state.rules)
        const duplicate = existing.has(`${r.date}|${r.amount.toFixed(2)}|${r.description.trim().toLowerCase()}`)
        return { ...r, ...c, review: needsReview({ ...c, reviewed: false }), duplicate }
      }),
    [parsed, state.rules, existing],
  )
  const errors = useMemo(() => parsed?.errors ?? [], [parsed])
  const lines = useMemo(
    () => [...preview.map((p) => ({ kind: 'row' as const, line: p.line, row: p })), ...errors.map((e) => ({ kind: 'error' as const, line: e.line, error: e }))].sort((a, b) => a.line - b.line),
    [preview, errors],
  )
  const chosen = preview.filter((p) => !p.duplicate && !excluded.has(p.line))
  const reviewCount = chosen.filter((p) => p.review).length
  const duplicates = preview.filter((p) => p.duplicate).length

  const load = (value: string, name: string | null) => {
    setText(value)
    setFileName(name)
    setExcluded(new Set())
  }
  const readFile = (file: File | undefined) => {
    if (!file) return
    file.text().then((t) => load(t, file.name))
  }
  const toggle = (line: number) =>
    setExcluded((s) => {
      const next = new Set(s)
      if (next.has(line)) next.delete(line)
      else next.add(line)
      return next
    })

  // Start fresh each time it opens (resetting on close would flash the empty state while it fades out).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      load('', null)
      setPasting(false)
      setShowRows(false)
    }
  }
  const close = onOpenChange

  const col = (i: number | undefined) => (i === undefined ? '—' : `“${header[i] ?? `column ${i + 1}`}”`)

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[min(92dvh,52rem)] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-3 px-5 pt-5 pb-4 text-left sm:px-6">
          <DialogTitle className="font-display text-xl tracking-tight">Import a bank statement</DialogTitle>
          <ol className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Steps">
            {['Add a file', 'Check the rows', 'Import'].map((label, i) => {
              const step = parsed ? 1 : 0
              return (
                <li key={label} className={cn('flex items-center gap-1.5', i === step ? 'text-foreground' : 'text-muted-foreground')} aria-current={i === step ? 'step' : undefined}>
                  <span className={cn('flex size-5 items-center justify-center rounded-full border text-[11px] tabular-nums', i === step ? 'border-foreground' : 'border-border')}>{i + 1}</span>
                  {label}
                </li>
              )
            })}
          </ol>
          <DialogDescription className="flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
            Read in this browser. Nothing is uploaded.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto border-t border-border px-5 py-5 sm:px-6">
          {!parsed ? (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  readFile(e.dataTransfer.files[0])
                }}
                className={cn(
                  'flex flex-col items-center gap-4 rounded-md border border-dashed px-4 py-10 text-center transition-colors',
                  dragging ? 'border-foreground bg-accent/20' : 'border-border',
                )}
              >
                <FileUp aria-hidden="true" className="size-6 text-muted-foreground" />
                <p className="text-sm">Drop a CSV file from your bank here</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    Choose a file
                  </Button>
                  <Button size="sm" onClick={() => load(sampleStatement(today), 'sample-statement.csv')}>
                    Try a sample statement
                  </Button>
                </div>
                <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => readFile(e.target.files?.[0])} />
              </div>
              {pasting ? (
                <div className="space-y-1.5">
                  <Label htmlFor="csv-paste">Paste the text</Label>
                  <Textarea id="csv-paste" rows={5} autoFocus value={text} onChange={(e) => load(e.target.value, null)} placeholder={'Date,Description,Amount\n11/03/2026,"SQ *BLUE BOTTLE 0423",-5.75'} className="font-mono text-xs" />
                </div>
              ) : (
                <Button variant="link" size="sm" className="h-auto px-0 text-muted-foreground" onClick={() => setPasting(true)}>
                  Paste text instead
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-[15px] text-pretty">
                <span className="font-medium">{chosen.length} {chosen.length === 1 ? 'row' : 'rows'} ready</span>
                {reviewCount > 0 && `, ${reviewCount} will need review`}
                {errors.length > 0 && `, ${errors.length} could not be read`}
                {duplicates > 0 && `, ${duplicates} already in your list`}.
              </p>
              <div className="flex items-center gap-2">
                <Label htmlFor="import-account" className="shrink-0 text-sm text-muted-foreground">
                  Add to
                </Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger id="import-account" className="h-9 w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground" aria-expanded={showRows} onClick={() => setShowRows((v) => !v)}>
                <ChevronRight aria-hidden="true" className={cn('size-4 transition-transform duration-150', showRows && 'rotate-90')} />
                {showRows ? 'Hide the rows' : 'Check the rows'}
              </Button>
              {showRows && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {fileName ?? 'Pasted text'} · {DELIMITER_NAME[parsed.delimiter]} separated · date {col(parsed.columns.date)}, description {col(parsed.columns.description)},{' '}
                    {parsed.columns.amount !== undefined ? `amount ${col(parsed.columns.amount)}` : `debit ${col(parsed.columns.debit)}, credit ${col(parsed.columns.credit)}`}
                  </p>
                  {lines.length > 0 && (
                    <div className="rounded-md border border-border">
                      <div className="hidden grid-cols-[1.25rem_5.5rem_minmax(0,1fr)_minmax(0,11rem)_6rem] gap-3 border-b border-border px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase sm:grid">
                        <Checkbox
                          aria-label="Select all readable rows"
                          checked={excluded.size === 0 ? true : excluded.size >= preview.length ? false : 'indeterminate'}
                          onCheckedChange={(v) => setExcluded(v === true ? new Set() : new Set(preview.map((p) => p.line)))}
                        />
                        <span>Date</span>
                        <span>Description</span>
                        <span>Category</span>
                        <span className="text-right">Amount</span>
                      </div>
                      <ul className="divide-y divide-border">
                        {lines.map((l) =>
                          l.kind === 'error' ? (
                            <li key={`e${l.line}`} className="flex items-start gap-3 bg-destructive/5 px-3 py-2 text-xs">
                              <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                              <span>
                                <span className="font-mono text-muted-foreground">Line {l.line}</span> · skipped: {l.error.message}
                                <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">{text.split(/\r?\n/).filter((x) => x.trim())[l.line - 1]}</span>
                              </span>
                            </li>
                          ) : (
                            <li
                              key={`r${l.line}`}
                              className={cn(
                                'grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2 sm:grid-cols-[1.25rem_5.5rem_minmax(0,1fr)_minmax(0,11rem)_6rem]',
                                (l.row.duplicate || excluded.has(l.line)) && 'opacity-55',
                              )}
                            >
                              <Checkbox
                                aria-label={`Import line ${l.line}, ${l.row.description}`}
                                checked={!l.row.duplicate && !excluded.has(l.line)}
                                disabled={l.row.duplicate}
                                onCheckedChange={() => toggle(l.line)}
                              />
                              <span className="hidden font-mono text-xs text-muted-foreground sm:block">{formatDate(l.row.date, { year: false })}</span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm">{l.row.merchant}</span>
                                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                                  <span className="sm:hidden">{formatDate(l.row.date, { year: false })} · </span>
                                  {l.row.description}
                                </span>
                              </span>
                              <span className="col-start-2 row-start-2 flex min-w-0 items-center gap-2 sm:col-start-auto sm:row-start-auto" title={l.row.reason}>
                                <CategoryBadge categoryId={l.row.categoryId} size="sm" className="min-w-0" />
                                {l.row.duplicate ? (
                                  <span className="text-xs text-muted-foreground">already added</span>
                                ) : l.row.review ? (
                                  <span className="text-xs text-warning">review</span>
                                ) : null}
                              </span>
                              <Money value={l.row.amount} className="col-start-3 row-start-1 text-right text-sm sm:col-start-auto sm:row-start-auto" />
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
          {parsed ? (
            <>
              <Button variant="ghost" onClick={() => load('', null)}>
                Start over
              </Button>
              <Button
                disabled={chosen.length === 0}
                onClick={() => {
                  actions.importTransactions(
                    chosen.map(({ date, description, amount }) => ({ date, description, amount })),
                    { accountId },
                  )
                  close(false)
                }}
              >
                Import {chosen.length} {chosen.length === 1 ? 'row' : 'rows'}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => close(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
