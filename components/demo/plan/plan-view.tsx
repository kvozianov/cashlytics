'use client'

import { useSearchParams } from 'next/navigation'

import { PageHeader } from '@/components/demo/ui'
import { useHashScroll } from '@/components/demo/tax/use-hash-scroll'
import { isCategoryId } from '@/lib/demo/categories'

import { Budgets } from './budgets'
import { Goals } from './goals'
import { FiftyThirtyTwenty } from './split'

const SECTIONS = ['budgets', 'goals'] as const

export function PlanView() {
  const params = useSearchParams()
  const raw = params.get('budget')
  const focus = raw && isCategoryId(raw) ? raw : null
  useHashScroll(SECTIONS)

  return (
    <div className="space-y-12 sm:space-y-16">
      <PageHeader eyebrow="05 — Plan" title="Budgets & goals" description="What is left to spend this month, and when you will reach what you are saving for." />
      <div className="max-w-4xl">
        <Budgets key={focus ?? 'all'} focus={focus} />
      </div>
      <Goals />
      <div className="max-w-4xl">
        <FiftyThirtyTwenty />
      </div>
    </div>
  )
}
