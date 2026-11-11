import type { InvoiceStatus } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { STATUS_LABEL } from './format'

const tone: Record<InvoiceStatus, string> = {
  draft: 'text-muted-foreground border-dashed',
  sent: 'text-foreground',
  overdue: 'text-destructive border-double border-[3px] px-1',
  paid: 'text-success',
}

/** A small rubber-stamp label for tables: mono caps in a ruled box, never colour alone. */
export function StatusChip({ status, className }: { status: InvoiceStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[2px] border border-current px-1.5 py-px font-mono text-[11px] leading-4 font-medium tracking-[0.12em] whitespace-nowrap uppercase',
        status === 'overdue' && '-rotate-2',
        tone[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
