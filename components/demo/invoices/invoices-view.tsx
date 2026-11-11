'use client'

import { FilePlus2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

import { DetailSwitcher } from '@/components/demo/tax/quiet'
import { PageHeader } from '@/components/demo/ui'
import { Button } from '@/components/ui/button'
import { useDemo } from '@/lib/demo/store'
import type { Invoice } from '@/lib/demo/types'

import { ClientsPanel } from './clients-panel'
import { isStatusFilter, type StatusFilter } from './format'
import { InvoiceDetail } from './invoice-detail'
import { InvoiceEditor, type EditorMode } from './invoice-editor'
import { InvoiceList } from './invoice-list'
import { InvoiceSummary, PaymentSpeed } from './summary'

/**
 * URL state: `?status=` (list filter), `?invoice=<id>` (detail sheet), `?new=1` (blank editor).
 * Edit, duplicate and sample editors are local state: they make no sense as links.
 */
export function InvoicesView() {
  const { persona } = useDemo()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const statusParam = params.get('status')
  const filter: StatusFilter = isStatusFilter(statusParam) ? statusParam : 'all'
  const openId = params.get('invoice')
  const wantsNew = params.get('new') === '1'

  const [localEditor, setLocalEditor] = useState<EditorMode | null>(null)
  const editorMode: EditorMode | null = localEditor ?? (wantsNew ? { kind: 'new' } : null)

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      // The store applies ?persona= once on load; never write it back.
      next.delete('persona')
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) next.delete(k)
        else next.set(k, v)
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [params, pathname, router],
  )

  const closeEditor = () => {
    setLocalEditor(null)
    if (wantsNew) setParams({ new: null })
  }

  const isStarter = persona.id === 'starter'
  const [detail, setDetail] = useState<string | null>(null)

  return (
    <div className="space-y-12 sm:space-y-14">
      <PageHeader
        eyebrow="03 — Manage"
        title="Invoices"
        description="Bill clients and mark payments in. A paid invoice flows straight into income, tax and your health score."
        actions={
          <Button onClick={() => setParams({ new: '1', invoice: null })} className="btn-ink">
            <FilePlus2 aria-hidden="true" />
            New invoice
          </Button>
        }
      />

      {isStarter && (
        <div className="flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-pretty text-muted-foreground">
            Daniel&apos;s salary needs no invoice, but his side work for a local bakery does. Paid invoices count as taxable side income.
          </p>
          <Button variant="outline" className="shrink-0" onClick={() => setLocalEditor({ kind: 'sample' })}>
            Create a sample invoice
          </Button>
        </div>
      )}

      <InvoiceSummary />

      <div className="max-w-4xl">
        <InvoiceList
          filter={filter}
          onFilter={(f) => setParams({ status: f === 'all' ? null : f })}
          onOpen={(id) => setParams({ invoice: id })}
          onSample={() => setLocalEditor({ kind: 'sample' })}
          onNew={() => setParams({ new: '1' })}
        />
      </div>

      <DetailSwitcher
        className="max-w-4xl"
        label="More"
        value={detail}
        onChange={setDetail}
        items={[
          { id: 'clients', label: 'Clients', content: <ClientsPanel /> },
          { id: 'speed', label: 'Payment speed', content: <PaymentSpeed /> },
        ]}
      />

      <InvoiceDetail
        invoiceId={openId}
        onClose={() => setParams({ invoice: null })}
        onEdit={(invoice: Invoice) => setLocalEditor({ kind: 'edit', invoice })}
        onDuplicate={(invoice: Invoice) => {
          setParams({ invoice: null })
          setLocalEditor({ kind: 'duplicate', invoice })
        }}
      />

      <InvoiceEditor
        open={!!editorMode}
        mode={editorMode ?? { kind: 'new' }}
        onOpenChange={(o) => !o && closeEditor()}
        onSaved={(id) => {
          setLocalEditor(null)
          setParams({ new: null, invoice: id })
        }}
      />
    </div>
  )
}
