'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PERIODS } from '@/lib/demo/analytics'
import { useDemo } from '@/lib/demo/store'
import type { Period } from '@/lib/demo/types'

/** Global period filter stored in the demo state. */
export function PeriodSelect({ className }: { className?: string }) {
  const { state, actions } = useDemo()
  return (
    <Select value={state.period} onValueChange={(v) => actions.setPeriod(v as Period)}>
      <SelectTrigger size="sm" aria-label="Period" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {PERIODS.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
