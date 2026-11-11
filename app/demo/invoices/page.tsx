import { Suspense } from 'react'

import { InvoicesView } from '@/components/demo/invoices/invoices-view'

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesView />
    </Suspense>
  )
}
