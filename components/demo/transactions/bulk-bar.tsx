'use client'

import { Tags, Trash2 } from 'lucide-react'

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
import { Button } from '@/components/ui/button'
import { signedMoney } from '@/lib/demo/format'
import type { CategoryId } from '@/lib/demo/types'

import { CategoryPicker } from './category-picker'

interface BulkBarProps {
  count: number
  net: number
  linkedInvoices: number
  allMatching: number
  onSelectAll: () => void
  onDone: () => void
  onCategory: (id: CategoryId) => void
  onDelete: () => void
}

/** Floating bar for whatever is ticked in the ledger. */
export function BulkBar({ count, net, linkedInvoices, allMatching, onSelectAll, onDone, onCategory, onDelete }: BulkBarProps) {
  return (
    <div className="sticky bottom-3 z-30 mx-auto w-full max-w-3xl px-1" role="region" aria-label="Bulk actions">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-wrap items-center gap-2 rounded-md border border-border-strong bg-primary px-3 py-2 text-primary-foreground shadow-[4px_4px_0_0_var(--lime)] duration-200">
        <p className="mr-auto text-xs tabular-nums">
          {count === 0 ? 'Tick the transactions you want to change' : <>{count} selected <span className="opacity-70">· {signedMoney(net)}</span></>}
          {count > 0 && count < allMatching && (
            <button type="button" onClick={onSelectAll} className="ml-2 underline underline-offset-4 hover:no-underline">
              Select all {allMatching}
            </button>
          )}
        </p>
        {count > 0 && (
          <>
        <CategoryPicker onSelect={onCategory} className="h-8 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground dark:bg-transparent" align="end" aria-label="Set category for selected">
          <span className="flex items-center gap-1.5">
            <Tags aria-hidden="true" className="size-3.5" /> Set category
          </span>
        </CategoryPicker>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Trash2 aria-hidden="true" className="size-3.5" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {count} transaction{count === 1 ? '' : 's'}?</AlertDialogTitle>
              <AlertDialogDescription>
                Totals, balances and the tax estimate are recalculated without them.
                {linkedInvoices > 0 && ` ${linkedInvoices} of them ${linkedInvoices === 1 ? 'is an invoice payment; that invoice goes' : 'are invoice payments; those invoices go'} back to unpaid.`}{' '}
                Reset the demo to bring them back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDelete}>
                Delete {count}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={onDone} className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          Done
        </Button>
      </div>
    </div>
  )
}
