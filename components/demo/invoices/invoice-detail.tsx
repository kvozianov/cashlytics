'use client'

import Link from 'next/link'
import { Check, Copy, PencilLine, Printer, Send, Stamp as StampIcon, Trash2 } from 'lucide-react'
import { motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { MarginNote } from '@/components/brand'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { accountBalances } from '@/lib/demo/analytics'
import { isValidISODate } from '@/lib/demo/dates'
import { formatDate, money, relativeDays, signedMoney } from '@/lib/demo/format'
import { daysOverdue, invoiceStatus, invoiceTotal } from '@/lib/demo/invoices'
import { demoReducer } from '@/lib/demo/reducer'
import { useDemo } from '@/lib/demo/store'
import { estimateTax } from '@/lib/demo/tax'
import type { Invoice } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { STATUS_LABEL } from './format'
import { InvoicePaper } from './invoice-paper'
import { ChangeList, takeSnapshot, type Snapshot } from './knock-on'
import { PrintPortal } from './print-portal'
import { StatusChip } from './status-chip'

interface InvoiceDetailProps {
  invoiceId: string | null
  onClose: () => void
  onEdit: (invoice: Invoice) => void
  onDuplicate: (invoice: Invoice) => void
}

export function InvoiceDetail({ invoiceId, onClose, onEdit, onDuplicate }: InvoiceDetailProps) {
  const { state } = useDemo()
  const invoice = invoiceId ? state.invoices.find((i) => i.id === invoiceId) : undefined
  return (
    <Sheet open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        {invoice && <DetailBody key={invoice.id} invoice={invoice} onClose={onClose} onEdit={onEdit} onDuplicate={onDuplicate} />}
      </SheetContent>
    </Sheet>
  )
}

interface PaidMoment {
  before: Snapshot
  amount: number
  movedToReserve?: number
}

function DetailBody({ invoice, onClose, onEdit, onDuplicate }: { invoice: Invoice; onClose: () => void; onEdit: (i: Invoice) => void; onDuplicate: (i: Invoice) => void }) {
  const { state, today, persona, actions } = useDemo()
  const uid = useId()
  const client = state.clients.find((c) => c.id === invoice.clientId)
  const status = invoiceStatus(invoice, today)
  const total = invoiceTotal(invoice)
  const late = daysOverdue(invoice, today)

  const [paying, setPaying] = useState(false)
  const [moment, setMoment] = useState<PaidMoment | null>(null)
  const paper = useAnimationControls()
  const paperRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  function stampPaid(date: string, accountId: string) {
    const before = takeSnapshot(state, today)
    actions.markInvoicePaid(invoice.id, date, { accountId })
    setPaying(false)
    setMoment({ before, amount: total })
  }

  // Bring the stamp into view, then the paper takes the hit a beat after it starts falling.
  useEffect(() => {
    if (!moment) return
    paperRef.current?.querySelector('.stamp')?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    if (reduce) return
    const t = window.setTimeout(() => {
      void paper.start({ y: [0, 3, -1, 0], rotate: [0, 0.25, -0.1, 0], transition: { duration: 0.32, ease: 'easeOut' } })
    }, 420)
    return () => window.clearTimeout(t)
  }, [moment, paper, reduce])

  return (
    <>
      <SheetHeader className="gap-3 border-b border-border px-5 pt-5 pb-4 text-left sm:px-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pr-8">
          <SheetTitle className="font-mono text-lg font-medium tabular-nums">{invoice.number}</SheetTitle>
          <StatusChip status={status} />
          <span className="font-mono text-lg tabular-nums">{money(total)}</span>
        </div>
        <SheetDescription className="text-left">
          {client?.name ?? 'Unknown client'} · issued {formatDate(invoice.issueDate)} ·{' '}
          {status === 'paid' && invoice.paidDate
            ? `paid ${formatDate(invoice.paidDate)}`
            : status === 'overdue'
              ? `${late} days overdue`
              : `due ${relativeDays(invoice.dueDate, today)}`}
        </SheetDescription>
        <div className="flex flex-wrap gap-2">
          {status === 'draft' && (
            <Button size="sm" onClick={() => actions.markInvoiceSent(invoice.id)}>
              <Send aria-hidden="true" />
              Mark sent
            </Button>
          )}
          {(status === 'sent' || status === 'overdue') && !paying && (
            <Button size="sm" onClick={() => setPaying(true)} className={cn(status === 'overdue' && 'btn-ink')}>
              <StampIcon aria-hidden="true" />
              Mark paid
            </Button>
          )}
          {status !== 'paid' && (
            <Button size="sm" variant="outline" onClick={() => onEdit(invoice)}>
              <PencilLine aria-hidden="true" />
              Edit
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onDuplicate(invoice)}>
            <Copy aria-hidden="true" />
            Duplicate
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Print or save as PDF
          </Button>
          {status !== 'paid' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                  <Trash2 aria-hidden="true" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {invoice.number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The {STATUS_LABEL[status].toLowerCase()} invoice to {client?.name ?? 'this client'} for {money(total)} will be removed from this demo. Reset the
                    demo to get the original data back.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      actions.deleteInvoice(invoice.id)
                      onClose()
                    }}
                  >
                    Delete invoice
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </SheetHeader>

      <div className="space-y-6 px-5 py-6 sm:px-7">
        {paying && <MarkPaidForm uid={uid} invoice={invoice} onCancel={() => setPaying(false)} onConfirm={stampPaid} />}

        <div className="relative">
          {status === 'overdue' && (
            <div className="mb-1 flex justify-end pr-4">
              <MarginNote arrow="down" tone="signal" rotate={-2} size="sm">
                {late} days late. Nudge {client?.name.split(' ')[0] ?? 'them'}?
              </MarginNote>
            </div>
          )}
          <motion.div ref={paperRef} animate={paper} className="origin-bottom-left">
            <InvoicePaper invoice={invoice} client={client} from={persona} status={status} stampKey={`${invoice.id}-${status}`} />
          </motion.div>
        </div>

        {moment && status === 'paid' && <KnockOn moment={moment} onMoved={(amount) => setMoment((m) => (m ? { ...m, movedToReserve: amount } : m))} />}

        <Timeline invoice={invoice} />
      </div>

      <PrintPortal>
        <InvoicePaper invoice={invoice} client={client} from={persona} status={status} printable />
      </PrintPortal>
    </>
  )
}

function MarkPaidForm({ uid, invoice, onCancel, onConfirm }: { uid: string; invoice: Invoice; onCancel: () => void; onConfirm: (date: string, accountId: string) => void }) {
  const { state, today } = useDemo()
  const accounts = state.accounts.filter((a) => a.purpose !== 'tax')
  const [date, setDate] = useState(today)
  const [accountId, setAccountId] = useState(accounts.find((a) => a.purpose === 'everyday')?.id ?? accounts[0]?.id ?? '')
  const dateError = !isValidISODate(date) ? 'Enter a valid date.' : date > today ? 'A payment cannot arrive in the future.' : date < invoice.issueDate ? 'That is before the invoice was issued.' : ''

  // Run the same reducer on a copy to show what will move before anything does.
  const preview = useMemo(() => {
    if (dateError) return null
    const year = Number(today.slice(0, 4))
    const next = demoReducer(state, { type: 'markInvoicePaid', id: invoice.id, date, accountId })
    const taxBefore = estimateTax(state, year, today).estimatedTax
    const taxAfter = estimateTax(next, year, today).estimatedTax
    return { taxDelta: taxAfter - taxBefore }
  }, [state, invoice.id, date, accountId, today, dateError])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!dateError) onConfirm(date, accountId)
      }}
      noValidate
      className="space-y-4 rounded-md border border-foreground/80 bg-card p-4"
      aria-labelledby={`${uid}-paid-title`}
    >
      <div>
        <h3 id={`${uid}-paid-title`} className="font-medium">
          Record the payment
        </h3>
        <p className="text-[13px] text-muted-foreground">Creates one income transaction of {money(invoiceTotal(invoice))} linked to this invoice.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-paid-date`}>Date received</Label>
          <Input
            id={`${uid}-paid-date`}
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!dateError}
            aria-describedby={`${uid}-paid-date-err`}
            className="font-mono"
            autoFocus
          />
          <p id={`${uid}-paid-date-err`} className="text-[12px] text-destructive">
            {dateError}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-paid-acct`}>Paid into</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger id={`${uid}-paid-acct`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} ··{a.last4}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {preview && (
        <p className="font-mono text-[12.5px] text-muted-foreground tabular-nums">
          Will add <span className="text-success">{signedMoney(invoiceTotal(invoice))}</span> to income
          {Math.abs(preview.taxDelta) >= 1 && <> · tax estimate {signedMoney(preview.taxDelta, { whole: true })}</>}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="btn-ink" disabled={!!dateError}>
          <StampIcon aria-hidden="true" />
          Stamp it paid
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/** After "mark paid": everything that moved elsewhere in the demo, with links to see it there. */
function KnockOn({ moment, onMoved }: { moment: PaidMoment; onMoved: (amount: number) => void }) {
  const { state, today, actions } = useDemo()
  const after = takeSnapshot(state, today)
  const { before } = moment
  const reserve = state.accounts.find((a) => a.purpose === 'tax')
  const everyday = state.accounts.find((a) => a.purpose === 'everyday') ?? state.accounts[0]
  const toReserve = Math.max(0, Math.round(moment.amount * before.suggestedRate))
  const available = accountBalances(state, today).find((b) => b.account.id === everyday.id)?.balance ?? 0
  const canMove = toReserve > 0 && available >= toReserve

  function move() {
    const target = reserve?.id ?? actions.openTaxReserve()
    actions.transfer(everyday.id, target, toReserve, { note: 'Tax set-aside' })
    onMoved(toReserve)
  }

  return (
    <section aria-labelledby="knock-on-title" className="paper px-5 py-6 sm:px-6" data-edge="bottom">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="knock-on-title" className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          What moved
        </h3>
        <p className="text-[13px] text-muted-foreground">Payment recorded</p>
      </div>
      <ChangeList
        className="mt-2"
        changes={[
          { label: `Income · ${after.periodLabel.toLowerCase()}`, before: before.income, after: after.income, href: '/demo', hrefLabel: 'open the overview' },
          { label: 'Tax estimate, this year', before: before.estimatedTax, after: after.estimatedTax, goodWhen: 'neutral', href: '/demo/tax', hrefLabel: 'open tax' },
          { label: 'Health score', before: before.health, after: after.health, kind: 'number', href: '/demo/insights', hrefLabel: 'open insights' },
        ]}
      />
      <div className="mt-4 flex flex-col gap-3 border-t border-dashed border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        {moment.movedToReserve ? (
          <p className="flex items-center gap-2 text-[13px]">
            <Check aria-hidden="true" className="size-4 text-success" />
            {money(moment.movedToReserve, { whole: true })} is now in the tax reserve.
          </p>
        ) : toReserve > 0 ? (
          <>
            <p className="text-[13px] text-pretty">Put part of this payment aside for the tax it adds.</p>
            <Button size="sm" onClick={move} disabled={!canMove} className="shrink-0">
              Move {money(toReserve, { whole: true })} to tax reserve
            </Button>
          </>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            No extra set-aside needed for this one. <Link href="/demo/tax#set-aside" className="underline underline-offset-4">See why</Link>
          </p>
        )}
      </div>
    </section>
  )
}

function Timeline({ invoice }: { invoice: Invoice }) {
  const { today } = useDemo()
  const status = invoiceStatus(invoice, today)
  const steps = [
    { label: 'Created', date: invoice.issueDate, done: true },
    { label: 'Sent', date: invoice.sentDate, done: !!invoice.sentDate },
    { label: status === 'overdue' ? 'Due (missed)' : 'Due', date: invoice.dueDate, done: invoice.dueDate <= today || status === 'paid', late: status === 'overdue' },
    { label: 'Paid', date: invoice.paidDate, done: status === 'paid' },
  ]
  return (
    <section aria-label="Invoice timeline">
      <h3 className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Timeline</h3>
      <ol className="grid grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.label} className="relative pr-2">
            <div className="flex items-center">
              <span
                aria-hidden="true"
                className={cn(
                  'z-10 size-3 shrink-0 rounded-full border-2',
                  s.late ? 'border-destructive bg-destructive' : s.done ? 'border-foreground bg-foreground' : 'border-border bg-card',
                )}
              />
              {i < steps.length - 1 && <span aria-hidden="true" className={cn('h-px flex-1', steps[i + 1].done ? 'bg-foreground' : 'border-t border-dashed border-border')} />}
            </div>
            <p className={cn('mt-2 text-[13px] font-medium', s.late && 'text-destructive')}>{s.label}</p>
            <p className="font-mono text-[12px] text-muted-foreground tabular-nums">
              {s.date ? formatDate(s.date, { year: false }) : '—'}
              <span className="sr-only">{s.done ? ' (done)' : ' (not yet)'}</span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
