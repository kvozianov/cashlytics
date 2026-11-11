import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface SectionCardProps {
  title?: ReactNode
  description?: ReactNode
  /** Controls in the card header, right-aligned. */
  actions?: ReactNode
  footer?: ReactNode
  /** Drop the body padding, e.g. for tables that run edge to edge. */
  flush?: boolean
  id?: string
  className?: string
  children: ReactNode
}

/** Hairline-bordered panel with an optional header and footer. */
export function SectionCard({ title, description, actions, footer, flush = false, id, className, children }: SectionCardProps) {
  return (
    <section id={id} className={cn('flex min-w-0 flex-col rounded-md border border-border bg-card text-card-foreground', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0 space-y-0.5">
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('flex-1', !flush && 'p-4 sm:p-5')}>{children}</div>
      {footer && <div className="border-t border-border px-4 py-3 text-[13px] text-muted-foreground sm:px-5">{footer}</div>}
    </section>
  )
}
