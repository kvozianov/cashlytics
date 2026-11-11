import { Stamp } from '@/components/brand'
import { formatDate, money } from '@/lib/demo/format'
import { invoiceSubtotal, invoiceTaxAmount, invoiceTotal, lineTotal } from '@/lib/demo/invoices'
import type { Client, InvoiceLine, InvoiceStatus, ISODate, Persona } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { letterhead, termsLabel } from './format'

export interface PaperInvoice {
  number: string
  issueDate: ISODate
  dueDate: ISODate
  lines: Pick<InvoiceLine, 'description' | 'quantity' | 'unitPrice'>[]
  taxRate?: number
  notes?: string
  paidDate?: ISODate
}

interface InvoicePaperProps {
  invoice: PaperInvoice
  client?: Pick<Client, 'name' | 'email'>
  from: Pick<Persona, 'id' | 'name' | 'role'>
  /** Stamp shown on the paper; `none` for a live preview without one. */
  status: InvoiceStatus | 'none'
  /** Change it to make the stamp land again. */
  stampKey?: string
  /** Plain version for the printer: no motion, no grain. */
  printable?: boolean
  className?: string
  id?: string
}

const STAMP: Record<InvoiceStatus, { text: string; tone: 'signal' | 'ink' | 'success'; rotate: number }> = {
  draft: { text: 'Draft', tone: 'ink', rotate: -3 },
  sent: { text: 'Sent', tone: 'ink', rotate: 2 },
  overdue: { text: 'Overdue', tone: 'signal', rotate: -4 },
  paid: { text: 'Paid', tone: 'success', rotate: -4 },
}

/** The invoice as a printed document: letterhead, bill-to, line items, totals, terms. */
export function InvoicePaper({ invoice, client, from, status, stampKey, printable = false, className, id }: InvoicePaperProps) {
  const head = letterhead(from)
  const subtotal = invoiceSubtotal(invoice)
  const tax = invoiceTaxAmount(invoice)
  const total = invoiceTotal(invoice)
  const terms = termsLabel(invoice.issueDate, invoice.dueDate)
  const lines = invoice.lines.filter((l) => l.description.trim() || l.quantity || l.unitPrice)
  // A printed copy goes to the client, so it carries no internal "sent" mark.
  const stamp = status === 'none' || (printable && status === 'sent') ? null : STAMP[status]

  return (
    <article
      id={id}
      aria-label={`Invoice ${invoice.number}`}
      className={cn(
        'invoice-paper relative isolate overflow-hidden rounded-[3px] border border-border bg-card text-card-foreground',
        !printable && 'shadow-[0_1px_0_var(--border),0_14px_30px_-22px_color-mix(in_oklab,var(--foreground)_45%,transparent)]',
        className,
      )}
    >
      {/* left binding margin rule, like ledger paper */}
      <span aria-hidden="true" className="absolute inset-y-0 left-6 w-px bg-destructive/25 sm:left-9" />
      <div className="px-9 py-7 sm:px-14 sm:py-10">
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight font-semibold tracking-tight sm:text-2xl">{head.name}</p>
            <p className="text-[13px] text-muted-foreground">{head.role}</p>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">{head.email}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground uppercase">Invoice</p>
            <p className="font-mono text-lg font-medium tabular-nums sm:text-xl">{invoice.number}</p>
          </div>
        </header>

        <div className="mt-6 grid gap-5 border-t border-foreground/80 pt-5 sm:grid-cols-[1fr_auto] sm:gap-10">
          <div className="min-w-0">
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Bill to</p>
            <p className="mt-1 font-medium">{client?.name ?? <span className="text-muted-foreground">Choose a client</span>}</p>
            {client?.email && <p className="font-mono text-[12px] break-all text-muted-foreground">{client.email}</p>}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 font-mono text-[12.5px] tabular-nums sm:text-right">
            <dt className="text-muted-foreground uppercase">Issued</dt>
            <dd>{formatDate(invoice.issueDate)}</dd>
            <dt className="text-muted-foreground uppercase">Due</dt>
            <dd>{formatDate(invoice.dueDate)}</dd>
            <dt className="text-muted-foreground uppercase">Terms</dt>
            <dd>{terms}</dd>
            {invoice.paidDate && (
              <>
                <dt className="text-muted-foreground uppercase">Paid</dt>
                <dd>{formatDate(invoice.paidDate)}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="mt-7">
          <div className="flex items-baseline gap-2 border-b border-foreground/80 pb-1.5 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            <span className="flex-1">Description</span>
            <span className="hidden w-28 text-right sm:block">Qty × rate</span>
            <span className="w-24 text-right">Amount</span>
          </div>
          <ul className="divide-y divide-dashed divide-border">
            {lines.length === 0 && <li className="py-3 text-sm text-muted-foreground">Add a line item to see it here.</li>}
            {lines.map((line, i) => (
              <li key={i} className="py-2.5 text-[13.5px]">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 break-words">{line.description || <span className="text-muted-foreground">Untitled item</span>}</span>
                  <span aria-hidden="true" className="ldr-leader" />
                  <span className="hidden w-28 shrink-0 text-right font-mono text-[12.5px] text-muted-foreground tabular-nums sm:block">
                    {fmtQty(line.quantity)} × {money(line.unitPrice)}
                  </span>
                  <span className="w-24 shrink-0 text-right font-mono tabular-nums">{money(lineTotal(line))}</span>
                </div>
                <p className="font-mono text-[12px] text-muted-foreground tabular-nums sm:hidden">
                  {fmtQty(line.quantity)} × {money(line.unitPrice)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap-reverse items-center justify-between gap-x-6 gap-y-4 border-t border-border pt-3">
          <div className="pl-1">
            {stamp && (
              <Stamp
                key={stampKey ?? status}
                tone={stamp.tone}
                rotate={stamp.rotate}
                size="lg"
                still={printable}
                note={status === 'paid' && invoice.paidDate ? formatDate(invoice.paidDate) : undefined}
                className="bg-transparent"
              >
                {stamp.text}
              </Stamp>
            )}
          </div>
          <dl className="ml-auto grid w-full max-w-72 grid-cols-[1fr_auto] gap-x-6 gap-y-1 font-mono text-[13px] tabular-nums">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-right">{money(subtotal)}</dd>
            {invoice.taxRate ? (
              <>
                <dt className="text-muted-foreground">Tax {+(invoice.taxRate * 100).toFixed(2)}%</dt>
                <dd className="text-right">{money(tax)}</dd>
              </>
            ) : null}
            <dt className="col-span-2 mt-1 h-0 border-t-4 border-double border-foreground" aria-hidden="true" />
            <dt className="pt-1 font-sans text-sm font-semibold">Total due</dt>
            <dd className="pt-1 text-right text-base font-semibold">{money(total)}</dd>
          </dl>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-7 max-w-prose">
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Notes</p>
            <p className="mt-1 text-[13px] whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        <footer className="mt-8 flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-border pt-4 text-[12px] text-muted-foreground">
          <p className="max-w-sm text-pretty">
            Please pay {money(total)} by {formatDate(invoice.dueDate)}, quoting {invoice.number}.
          </p>
          <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase">Fictional · demo document, not a real bill</p>
        </footer>
      </div>

    </article>
  )
}

function fmtQty(q: number) {
  return Number.isInteger(q) ? String(q) : q.toFixed(2).replace(/0$/, '')
}
