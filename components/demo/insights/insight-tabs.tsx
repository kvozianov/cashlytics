'use client'

import { useEffect, useRef, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePersona } from '@/lib/demo/hooks'

import { Anomalies } from './anomalies'
import { ForecastSimulator } from './forecast'
import { IncomeStability } from './income-stability'
import { SubscriptionsAudit } from './subscriptions'

const ALL = [
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'jumps', label: 'Spending jumps' },
  { id: 'stability', label: 'Income stability' },
  { id: 'forecast', label: 'Forecast' },
] as const

type TabId = (typeof ALL)[number]['id']

// A tab the persona does not have falls back to the first one when rendered.
function fromHash(): TabId | undefined {
  const h = typeof window === 'undefined' ? '' : window.location.hash.slice(1)
  return ALL.find((t) => t.id === h)?.id
}

/** The deeper analyses, one at a time. `#subscriptions`, `#jumps`, `#stability` and `#forecast` open a tab directly. */
export function InsightTabs() {
  const persona = usePersona()
  const tabs = ALL.filter((t) => t.id !== 'stability' || persona.id !== 'starter')
  const ref = useRef<HTMLElement>(null)
  const [tab, setTab] = useState<TabId>(() => fromHash() ?? 'subscriptions')
  const current = tabs.some((t) => t.id === tab) ? tab : 'subscriptions'

  // The page renders after the demo data loads, so the browser's own jump to the hash has already missed.
  useEffect(() => {
    if (fromHash()) ref.current?.scrollIntoView({ block: 'start' })
    const onHash = () => {
      const next = fromHash()
      if (next) {
        setTab(next)
        ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const change = (value: string) => {
    setTab(value as TabId)
    window.history.replaceState(window.history.state, '', `#${value}`)
  }

  return (
    <section ref={ref} id="more-insights" aria-label="More analysis" className="scroll-mt-28">
      {tabs.map((t) => (
        <span key={t.id} id={t.id} aria-hidden="true" className="block scroll-mt-28" />
      ))}
      <Tabs value={current} onValueChange={change}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="subscriptions" className="pt-8">
          <SubscriptionsAudit />
        </TabsContent>
        <TabsContent value="jumps" className="pt-8">
          <Anomalies />
        </TabsContent>
        {persona.id !== 'starter' && (
          <TabsContent value="stability" className="pt-8">
            <IncomeStability />
          </TabsContent>
        )}
        <TabsContent value="forecast" className="pt-8">
          <ForecastSimulator />
        </TabsContent>
      </Tabs>
    </section>
  )
}
