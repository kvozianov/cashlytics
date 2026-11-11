import { Suspense } from 'react'

import { PlanView } from '@/components/demo/plan/plan-view'

export default function PlanPage() {
  return (
    <Suspense>
      <PlanView />
    </Suspense>
  )
}
