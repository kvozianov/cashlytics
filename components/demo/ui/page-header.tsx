import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  /** One or two sentences under the title. */
  description?: ReactNode
  /** Small mono label above the title, e.g. `02 — Manage`. */
  eyebrow?: string
  /** Buttons on the right (wrap below on small screens). */
  actions?: ReactNode
  className?: string
}

/** Page title block used at the top of every demo page. */
export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description && <div className="max-w-2xl text-sm text-pretty text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
