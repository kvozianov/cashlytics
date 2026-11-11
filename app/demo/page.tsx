'use client'

import { Attention, CashFlow, HealthCompact, MoreDetails, Situation } from '@/components/demo/overview'

export default function OverviewPage() {
  return (
    <div className="space-y-14 sm:space-y-16">
      <Situation />
      <CashFlow />
      <HealthCompact className="lg:hidden" />
      <Attention />
      <MoreDetails />
    </div>
  )
}
