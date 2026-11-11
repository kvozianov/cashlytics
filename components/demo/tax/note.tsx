import { cn } from '@/lib/utils'

/** The standing disclaimer for every tax figure in the demo. */
export function TaxNote({ className }: { className?: string }) {
  return (
    <p className={cn('font-mono text-[11px] tracking-wide text-muted-foreground uppercase', className)}>
      Illustrative estimate, not tax advice. Rates are editable.
    </p>
  )
}
