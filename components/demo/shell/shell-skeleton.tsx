import { Skeleton } from '@/components/ui/skeleton'

/** Shown while the demo data loads from this browser. */
export function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the demo…</span>
      <div className="hidden w-60 shrink-0 space-y-6 border-r border-border px-4 py-5 lg:block">
        <Skeleton className="h-7 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="h-9 border-b border-border bg-muted" />
        <div className="flex h-14 items-center gap-3 border-b border-border px-6">
          <Skeleton className="h-6 w-40" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="size-8" />
        </div>
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
    </div>
  )
}
