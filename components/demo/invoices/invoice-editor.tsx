'use client'

import { Plus, Trash2, UserPlus } from 'lucide-react'
import { useId, useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { addDays, diffDays, isValidISODate } from '@/lib/demo/dates'
import { formatDate, money } from '@/lib/demo/format'
import { invoiceTotal, nextInvoiceNumber } from '@/lib/demo/invoices'
import { useDemo } from '@/lib/demo/store'
import type { Invoice } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { TERMS_OPTIONS } from './format'
import { InvoicePaper } from './invoice-paper'

interface LineDraft {
  key: number
  description: string
  quantity: string
  unitPrice: string
}

interface Draft {
  clientId: string
  issueDate: string
  terms: string
  lines: LineDraft[]
  taxPct: string
  notes: string
}

export type EditorMode = { kind: 'new' } | { kind: 'sample' } | { kind: 'edit'; invoice: Invoice } | { kind: 'duplicate'; invoice: Invoice }

interface InvoiceEditorProps {
  open: boolean
  mode: EditorMode
  onOpenChange: (open: boolean) => void
  /** Called with the id of the invoice that was created or saved. */
  onSaved: (id: string) => void
}

const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))

/** Create or edit an invoice, with the paper preview updating beside the form. */
export function InvoiceEditor({ open, mode, onOpenChange, onSaved }: InvoiceEditorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-6xl">
        {open && <EditorBody mode={mode} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  )
}

function EditorBody({ mode, onClose, onSaved }: { mode: EditorMode; onClose: () => void; onSaved: (id: string) => void }) {
  const { state, today, persona, actions } = useDemo()
  const uid = useId()
  const editing = mode.kind === 'edit' ? mode.invoice : null

  const [draft, setDraft] = useState<Draft>(() => initialDraft(mode, state.clients, today, persona.id))
  const [touched, setTouched] = useState(false)
  const [addingClient, setAddingClient] = useState(false)
  const [client, setClient] = useState({ name: '', email: '', terms: '14' })
  const [clientTouched, setClientTouched] = useState(false)
  const [nextKey, setNextKey] = useState(100)

  const selectedClient = state.clients.find((c) => c.id === draft.clientId)
  const termsDays = Number(draft.terms)
  const issueValid = isValidISODate(draft.issueDate)
  const dueDate = issueValid ? addDays(draft.issueDate, termsDays) : today
  const taxPct = draft.taxPct.trim() === '' ? 0 : num(draft.taxPct)

  const parsedLines = draft.lines.map((l) => ({ description: l.description.trim(), quantity: num(l.quantity), unitPrice: num(l.unitPrice) }))
  const lineErrors = draft.lines.map((l, i) => {
    const p = parsedLines[i]
    return {
      description: p.description ? '' : 'Describe the work',
      quantity: Number.isFinite(p.quantity) && p.quantity > 0 ? '' : 'More than 0',
      unitPrice: Number.isFinite(p.unitPrice) && p.unitPrice >= 0 ? '' : 'A price, 0 or more',
    }
  })
  const errors = {
    client: draft.clientId ? '' : 'Pick a client or add a new one.',
    issueDate: issueValid ? '' : 'Enter a valid date.',
    lines: draft.lines.length ? '' : 'Add at least one line item.',
    taxPct: Number.isFinite(taxPct) && taxPct >= 0 && taxPct <= 50 ? '' : 'Between 0 and 50.',
  }
  const valid = !Object.values(errors).some(Boolean) && lineErrors.every((e) => !e.description && !e.quantity && !e.unitPrice)

  const preview = {
    number: editing?.number ?? nextInvoiceNumber(state.invoices),
    issueDate: issueValid ? draft.issueDate : today,
    dueDate,
    lines: parsedLines.map((l) => ({
      description: l.description,
      quantity: Number.isFinite(l.quantity) ? l.quantity : 0,
      unitPrice: Number.isFinite(l.unitPrice) ? l.unitPrice : 0,
    })),
    taxRate: Number.isFinite(taxPct) && taxPct > 0 ? taxPct / 100 : undefined,
    notes: draft.notes.trim() || undefined,
  }
  const total = invoiceTotal(preview)

  const termsChoices = useMemo(() => {
    const list: { days: number; label: string }[] = [...TERMS_OPTIONS]
    const extra = [selectedClient?.termsDays, editing ? diffDays(editing.dueDate, editing.issueDate) : undefined]
    for (const d of extra) if (d !== undefined && d > 0 && !list.some((o) => o.days === d)) list.push({ days: d, label: `Net ${d}` })
    return list.sort((a, b) => a.days - b.days)
  }, [selectedClient, editing])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const setLine = (key: number, patch: Partial<LineDraft>) => setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }))

  const clientErrors = {
    name: client.name.trim() ? '' : 'Enter a name.',
    email: /^\S+@\S+\.\S+$/.test(client.email.trim()) ? '' : 'Enter an email address.',
  }

  function addClient() {
    setClientTouched(true)
    if (clientErrors.name || clientErrors.email) return
    const id = actions.addClient({ name: client.name.trim(), email: client.email.trim(), termsDays: Number(client.terms) })
    setDraft((d) => ({ ...d, clientId: id, terms: client.terms }))
    setAddingClient(false)
    setClient({ name: '', email: '', terms: '14' })
    setClientTouched(false)
  }

  function save(sendNow: boolean) {
    setTouched(true)
    if (!valid) {
      document.getElementById(`${uid}-form`)?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    const lines = parsedLines.map((l, i) => ({ id: editing?.lines[i]?.id ?? `line-${i + 1}`, ...l }))
    const taxRate = taxPct > 0 ? taxPct / 100 : 0
    if (editing) {
      actions.updateInvoice(editing.id, { clientId: draft.clientId, issueDate: draft.issueDate, dueDate, lines, notes: draft.notes.trim() || undefined, taxRate })
      if (sendNow && editing.status === 'draft') actions.markInvoiceSent(editing.id)
      onSaved(editing.id)
    } else {
      const created = actions.addInvoice({
        clientId: draft.clientId,
        issueDate: draft.issueDate,
        dueDate,
        lines,
        notes: draft.notes.trim() || undefined,
        taxRate: taxRate || undefined,
        status: sendNow ? 'sent' : 'draft',
      })
      onSaved(created.id)
    }
    onClose()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    save(false)
  }

  const show = (msg: string) => (touched && msg ? msg : '')

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <form id={`${uid}-form`} onSubmit={onSubmit} noValidate className="flex min-w-0 flex-col gap-5 p-5 sm:p-6">
        <DialogHeader className="text-left">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{preview.number}</p>
          <DialogTitle className="font-display text-xl">{editing ? 'Edit invoice' : mode.kind === 'sample' ? 'A sample invoice' : mode.kind === 'duplicate' ? `Copy of ${mode.invoice.number}` : 'New invoice'}</DialogTitle>
          <DialogDescription>
            {mode.kind === 'sample'
              ? 'Filled in with example work so you can see the whole flow. Change anything, then save it.'
              : 'The preview updates as you type. Nothing is sent anywhere: this is a demo.'}
          </DialogDescription>
        </DialogHeader>

        {/* Client */}
        <fieldset className="space-y-2">
          <legend className="sr-only">Client</legend>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor={`${uid}-client`}>Client</Label>
              <Select
                value={draft.clientId}
                onValueChange={(v) => {
                  const c = state.clients.find((x) => x.id === v)
                  setDraft((d) => ({ ...d, clientId: v, terms: String(c?.termsDays ?? d.terms) }))
                }}
              >
                <SelectTrigger
                  id={`${uid}-client`}
                  className="w-full"
                  aria-invalid={!!show(errors.client)}
                  aria-describedby={show(errors.client) ? `${uid}-client-err` : undefined}
                >
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {state.clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" onClick={() => setAddingClient((v) => !v)} aria-expanded={addingClient} aria-label="New client" className="shrink-0">
              <UserPlus aria-hidden="true" />
              <span className="hidden sm:inline">New client</span>
            </Button>
          </div>
          {show(errors.client) && (
            <p id={`${uid}-client-err`} className="text-[12.5px] text-destructive">
              {errors.client}
            </p>
          )}
          {addingClient && (
            <div className="grid gap-3 rounded-md border border-dashed border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1">
                <Label htmlFor={`${uid}-cname`} className="text-xs">
                  Client name
                </Label>
                <Input
                  id={`${uid}-cname`}
                  value={client.name}
                  onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))}
                  aria-invalid={clientTouched && !!clientErrors.name}
                  aria-describedby={`${uid}-cname-err`}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addClient())}
                />
                <p id={`${uid}-cname-err`} className="text-[12px] text-destructive">
                  {clientTouched ? clientErrors.name : ''}
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${uid}-cemail`} className="text-xs">
                  Billing email
                </Label>
                <Input
                  id={`${uid}-cemail`}
                  type="email"
                  placeholder="accounts@client.example"
                  value={client.email}
                  onChange={(e) => setClient((c) => ({ ...c, email: e.target.value }))}
                  aria-invalid={clientTouched && !!clientErrors.email}
                  aria-describedby={`${uid}-cemail-err`}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addClient())}
                />
                <p id={`${uid}-cemail-err`} className="text-[12px] text-destructive">
                  {clientTouched ? clientErrors.email : ''}
                </p>
              </div>
              <div className="flex items-start gap-2 sm:pt-5">
                <Select value={client.terms} onValueChange={(v) => setClient((c) => ({ ...c, terms: v }))}>
                  <SelectTrigger aria-label="Usual payment terms" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS_OPTIONS.map((t) => (
                      <SelectItem key={t.days} value={String(t.days)}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addClient}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-issue`}>Issue date</Label>
            <Input
              id={`${uid}-issue`}
              type="date"
              value={draft.issueDate}
              onChange={(e) => set('issueDate', e.target.value)}
              aria-invalid={!!show(errors.issueDate)}
              aria-describedby={`${uid}-issue-err`}
              className="font-mono"
            />
            <p id={`${uid}-issue-err`} className="text-[12px] text-destructive">
              {show(errors.issueDate)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-terms`}>Payment terms</Label>
            <Select value={draft.terms} onValueChange={(v) => set('terms', v)}>
              <SelectTrigger id={`${uid}-terms`} className="w-full" aria-describedby={`${uid}-terms-hint`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {termsChoices.map((t) => (
                  <SelectItem key={t.days} value={String(t.days)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id={`${uid}-terms-hint`} className="font-mono text-[12px] text-muted-foreground">
              Due {issueValid ? formatDate(dueDate) : '—'}
            </p>
          </div>
        </div>

        {/* Line items */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Line items</legend>
          <div className="hidden grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_2.25rem] gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase sm:grid">
            <span>Description</span>
            <span>Qty</span>
            <span>Rate, $</span>
            <span className="sr-only">Remove</span>
          </div>
          <ol className="space-y-3 sm:space-y-2">
            {draft.lines.map((line, i) => {
              const e = lineErrors[i]
              const n = i + 1
              return (
                <li key={line.key} className="grid grid-cols-[1fr_1fr_2.25rem] gap-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_2.25rem]">
                  <div className="col-span-3 sm:col-span-1">
                    <Label htmlFor={`${uid}-d${line.key}`} className="sr-only">
                      Line {n} description
                    </Label>
                    <Input
                      id={`${uid}-d${line.key}`}
                      placeholder="What you did"
                      value={line.description}
                      onChange={(ev) => setLine(line.key, { description: ev.target.value })}
                      aria-invalid={!!show(e.description)}
                      aria-describedby={`${uid}-e${line.key}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${uid}-q${line.key}`} className="mb-1 text-[11px] font-normal text-muted-foreground sm:sr-only">
                      <span className="sm:hidden">Qty</span>
                      <span className="sr-only">Line {n} quantity</span>
                    </Label>
                    <Input
                      id={`${uid}-q${line.key}`}
                      inputMode="decimal"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(ev) => setLine(line.key, { quantity: ev.target.value })}
                      aria-invalid={!!show(e.quantity)}
                      aria-describedby={`${uid}-e${line.key}`}
                      className="text-right font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${uid}-r${line.key}`} className="mb-1 text-[11px] font-normal text-muted-foreground sm:sr-only">
                      <span className="sm:hidden">Rate, $</span>
                      <span className="sr-only">Line {n} rate in dollars</span>
                    </Label>
                    <Input
                      id={`${uid}-r${line.key}`}
                      inputMode="decimal"
                      placeholder="Rate"
                      value={line.unitPrice}
                      onChange={(ev) => setLine(line.key, { unitPrice: ev.target.value })}
                      aria-invalid={!!show(e.unitPrice)}
                      aria-describedby={`${uid}-e${line.key}`}
                      className="text-right font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end"
                    aria-label={`Remove line ${n}`}
                    disabled={draft.lines.length === 1}
                    onClick={() => setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== line.key) }))}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                  <p id={`${uid}-e${line.key}`} className={cn('col-span-3 text-[12px] text-destructive sm:col-span-4', !(touched && (e.description || e.quantity || e.unitPrice)) && 'sr-only')}>
                    {touched ? [e.description, e.quantity && `Quantity: ${e.quantity.toLowerCase()}`, e.unitPrice && `Rate: ${e.unitPrice.toLowerCase()}`].filter(Boolean).join(' · ') : ''}
                  </p>
                </li>
              )
            })}
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft((d) => ({ ...d, lines: [...d.lines, { key: nextKey, description: '', quantity: '1', unitPrice: '' }] }))
              setNextKey((k) => k + 1)
              window.setTimeout(() => document.getElementById(`${uid}-d${nextKey}`)?.focus(), 0)
            }}
          >
            <Plus aria-hidden="true" />
            Add line
          </Button>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-tax`}>Tax % (optional)</Label>
            <Input
              id={`${uid}-tax`}
              inputMode="decimal"
              placeholder="0"
              value={draft.taxPct}
              onChange={(e) => set('taxPct', e.target.value)}
              aria-invalid={!!show(errors.taxPct)}
              aria-describedby={`${uid}-tax-err`}
              className="text-right font-mono"
            />
            <p id={`${uid}-tax-err`} className="text-[12px] text-destructive">
              {show(errors.taxPct)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-notes`}>Notes (optional)</Label>
            <Textarea id={`${uid}-notes`} rows={2} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Thank you for your business." />
          </div>
        </div>

        <DialogFooter className="mt-auto flex-col-reverse items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-sm tabular-nums">
            Total <span className="font-medium">{money(total)}</span>
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="outline">
              {editing ? 'Save changes' : 'Save as draft'}
            </Button>
            {(!editing || editing.status === 'draft') && (
              <Button type="button" onClick={() => save(true)}>
                Save and mark sent
              </Button>
            )}
          </div>
        </DialogFooter>
      </form>

      <div className="min-w-0 border-t border-border bg-muted/50 p-4 sm:p-6 lg:border-t-0 lg:border-l" aria-label="Live preview">
        <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Live preview</p>
        <InvoicePaper invoice={preview} client={selectedClient} from={persona} status={editing ? (editing.status === 'draft' ? 'draft' : 'none') : 'draft'} stampKey="preview" />
      </div>
    </div>
  )
}

function initialDraft(mode: EditorMode, clients: { id: string; termsDays: number }[], today: string, personaId: string): Draft {
  if (mode.kind === 'edit' || mode.kind === 'duplicate') {
    const inv = mode.invoice
    return {
      clientId: inv.clientId,
      issueDate: mode.kind === 'edit' ? inv.issueDate : today,
      terms: String(Math.max(0, diffDays(inv.dueDate, inv.issueDate))),
      lines: inv.lines.map((l, i) => ({ key: i, description: l.description, quantity: String(l.quantity), unitPrice: String(l.unitPrice) })),
      taxPct: inv.taxRate ? String(+(inv.taxRate * 100).toFixed(2)) : '',
      notes: inv.notes ?? '',
    }
  }
  const first = clients[0]
  if (mode.kind === 'sample') {
    const sample =
      personaId === 'business'
        ? [
            { key: 0, description: 'Coffee and pastries for 30 guests', quantity: '1', unitPrice: '420' },
            { key: 1, description: 'Barista on site, hours', quantity: '3', unitPrice: '35' },
          ]
        : personaId === 'starter'
          ? [
              { key: 0, description: 'Weekly sales dashboard, setup', quantity: '6', unitPrice: '45' },
              { key: 1, description: 'Handover call', quantity: '1', unitPrice: '45' },
            ]
          : [
              { key: 0, description: 'Checkout flow redesign', quantity: '12', unitPrice: '95' },
              { key: 1, description: 'Usability test sessions', quantity: '3', unitPrice: '150' },
            ]
    return { clientId: first?.id ?? '', issueDate: today, terms: String(first?.termsDays ?? 14), lines: sample, taxPct: '', notes: 'Thank you! Payment by bank transfer, please.' }
  }
  return {
    clientId: first?.id ?? '',
    issueDate: today,
    terms: String(first?.termsDays ?? 14),
    lines: [{ key: 0, description: '', quantity: '1', unitPrice: '' }],
    taxPct: '',
    notes: '',
  }
}
