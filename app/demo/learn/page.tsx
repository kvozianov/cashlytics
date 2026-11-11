import { Suspense } from 'react'

import { LearnView } from '@/components/demo/learn'

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnView />
    </Suspense>
  )
}
