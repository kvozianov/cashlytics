'use client'

import { HealthHero, InsightTabs, WeakPoints } from '@/components/demo/insights'
import { PageHeader } from '@/components/demo/ui'

export default function InsightsPage() {
  return (
    <div className="space-y-16">
      <PageHeader eyebrow="06 — Plan" title="Insights" description="The weak points in your money strategy, found by plain rules over your own numbers." className="border-b-0 pb-0" />
      <HealthHero />
      <WeakPoints />
      <InsightTabs />
    </div>
  )
}
