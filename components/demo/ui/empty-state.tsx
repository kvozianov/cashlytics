import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  /** lucide icon component; defaults to an inbox. */
  icon?: LucideIcon
  title: string
  /** One sentence. */
  description?: ReactNode
  /** One action: a link (`href`) or a button (`onClick`). */
  action?: { label: string; href?: string; onClick?: () => void }
  className?: string
}

/** Designed empty state: icon, one sentence, one action. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border px-6 py-12 text-center', className)}>
      <span className="flex size-10 items-center justify-center rounded-md border border-border bg-card">
        <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-pretty text-muted-foreground">{description}</p>}
      </div>
      {action &&
        (action.href ? (
          <Button asChild variant="outline" size="sm">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  )
}
