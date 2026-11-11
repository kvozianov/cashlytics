'use client'

import Link from 'next/link'
import { RotateCcw } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useTour } from '@/components/demo/tour'
import { useDemo } from '@/lib/demo/store'

/** Always-visible notice that this is a demo with fictional, local-only data. */
export function DemoStrip() {
  const { persona, actions } = useDemo()
  const tour = useTour()
  return (
    <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border bg-muted px-4 py-1.5 text-xs sm:px-6">
      <p className="text-muted-foreground">
        <span className="font-mono font-medium tracking-wide text-foreground uppercase">Demo mode</span>
        <span aria-hidden="true"> · </span>
        Fictional data, stored only in this browser.
      </p>
      <div className="flex items-center gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <RotateCcw aria-hidden="true" className="size-3" />
              Reset demo
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset the demo for {persona.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Your changes to this persona (added transactions, paid invoices, rules, budgets) are removed and the original fictional data comes back.
                Nothing leaves your browser either way.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => actions.reset()}>Reset demo</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <button
          type="button"
          onClick={tour.start}
          disabled={tour.active}
          className="rounded-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:no-underline disabled:opacity-60"
        >
          Tour
        </button>
        <Link href="/demo/about" className="rounded-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          How it works
        </Link>
      </div>
    </div>
  )
}
