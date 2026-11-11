import { Suspense } from 'react'

import { TransactionsPage } from '@/components/demo/transactions/transactions-page'

export default function Page() {
  return (
    <Suspense>
      <TransactionsPage />
    </Suspense>
  )
}
