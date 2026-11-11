'use client'

import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/demo/ui'
import { useDemo } from '@/lib/demo/store'
import { estimateTax } from '@/lib/demo/tax'
import type { TaxSettings } from '@/lib/demo/types'

import { Deductibles } from './deductibles'
import { CoverCard, EstimateHero, NextPayment } from './hero'
import { TaxNote } from './note'
import { DetailSwitcher } from './quiet'
import { Schedule } from './schedule'
import { SetAside } from './set-aside'
import { SettingsPanel } from './settings-panel'
import { useHashScroll } from './use-hash-scroll'
import { WhatIf } from './what-if'

// Deep links open the matching detail panel first, then scroll to it.
const HASH_PANELS: Record<string, string> = { schedule: 'schedule', 'set-aside': 'set-aside', deductibles: 'deductibles' }

export function TaxView() {
  const { state, today, actions } = useDemo()
  // While a slider is being dragged the page previews the change; it is saved on release.
  const [draft, setDraft] = useState<Partial<TaxSettings> | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const settings = useMemo(() => ({ ...state.taxSettings, ...draft }), [state.taxSettings, draft])
  const year = Number(today.slice(0, 4))
  const estimate = useMemo(() => estimateTax({ ...state, taxSettings: settings }, year, today), [state, settings, year, today])

  useEffect(() => {
    const open = () => {
      const panel = HASH_PANELS[window.location.hash.slice(1)]
      if (panel) setDetail(panel)
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [])
  useHashScroll(Object.keys(HASH_PANELS))

  const commit = (patch: Partial<TaxSettings>) => {
    setDraft(null)
    actions.updateTaxSettings(patch)
  }

  return (
    <div className="space-y-12 sm:space-y-14">
      <div className="space-y-4">
        <PageHeader eyebrow="04 — Plan" title="Tax" description="What you owe so far, whether it is covered, and what to do next." />
        <div className="sticky top-(--demo-topbar-h) z-20 -mx-4 bg-background/95 px-4 py-1.5 sm:-mx-6 sm:px-6 sm:py-2">
          <TaxNote />
        </div>
      </div>

      <div data-tour="tax-estimate" className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <EstimateHero estimate={estimate} settings={settings} />
        <CoverCard estimate={estimate} />
      </div>

      <NextPayment estimate={estimate} />

      <DetailSwitcher
        label="More"
        value={detail}
        onChange={setDetail}
        items={[
          { id: 'schedule', label: 'Quarterly payments', content: <Schedule estimate={estimate} /> },
          { id: 'set-aside', label: 'Set-aside rule', content: <SetAside estimate={estimate} /> },
          { id: 'deductibles', label: 'Deductible costs', content: <Deductibles estimate={estimate} settings={settings} onCommit={commit} /> },
          { id: 'what-if', label: 'What if', content: <WhatIf estimate={estimate} settings={settings} /> },
          {
            id: 'settings',
            label: 'Rate & settings',
            content: <SettingsPanel settings={settings} onDraft={(patch) => setDraft((d) => ({ ...d, ...patch }))} onCommit={commit} />,
          },
        ]}
      />
    </div>
  )
}
