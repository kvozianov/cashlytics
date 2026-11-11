'use client'

import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface DetailItem {
  id: string
  label: string
  content: ReactNode
}

/**
 * Secondary panels behind a row of quiet toggles: nothing is open by default,
 * one opens at a time, and clicking the open one closes it again.
 */
export function DetailSwitcher({
  items,
  value,
  onChange,
  label = 'Details',
  className,
}: {
  items: DetailItem[]
  value: string | null
  onChange: (id: string | null) => void
  label?: string
  className?: string
}) {
  const uid = useId()
  const open = items.find((i) => i.id === value)
  return (
    <section aria-label={label} className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-border">
        <span className="mr-3 text-[13px] text-muted-foreground">{label}</span>
        {items.map((item) => {
          const active = item.id === value
          return (
            <button
              key={item.id}
              id={`${uid}-${item.id}-btn`}
              type="button"
              aria-expanded={active}
              aria-controls={`${uid}-${item.id}`}
              onClick={() => onChange(active ? null : item.id)}
              className={cn(
                '-mb-px flex items-center gap-1 border-b-2 px-3 py-2.5 text-[14px] transition-colors',
                active ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
              <ChevronDown aria-hidden="true" className={cn('size-3.5 transition-transform', active && 'rotate-180')} />
            </button>
          )
        })}
      </div>
      {open && (
        <div id={`${uid}-${open.id}`} role="region" aria-labelledby={`${uid}-${open.id}-btn`}>
          {open.content}
        </div>
      )}
    </section>
  )
}

/** "Show details" / "Hide details" around content that is not needed at first glance. */
export function ShowDetails({
  children,
  label = 'Show details',
  openLabel = 'Hide details',
  defaultOpen = false,
  className,
}: {
  children: ReactNode
  label?: string
  openLabel?: string
  defaultOpen?: boolean
  className?: string
}) {
  const uid = useId()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={uid}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[13px] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground"
      >
        {open ? openLabel : label}
        <ChevronDown aria-hidden="true" className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div id={uid} className="mt-4">
          {children}
        </div>
      )}
    </div>
  )
}
