'use client'

import { money } from '@/lib/demo/format'
import { useAccountBalances } from '@/lib/demo/hooks'
import { cn } from '@/lib/utils'

/** Balance per account and the total. */
export function Accounts({ className }: { className?: string }) {
  const { accounts, total } = useAccountBalances()
  return (
    <section aria-labelledby="accounts-title" className={cn('min-w-0', className)}>
      <h3 id="accounts-title" className="font-semibold tracking-tight">
        Accounts
      </h3>
      <ul className="mt-3">
        {accounts.map(({ account, balance }) => (
          <li key={account.id} className="flex items-baseline gap-2 py-1.5 text-sm">
            <span className="min-w-0 truncate">
              {account.name}
              {account.purpose === 'tax' && <span className="text-muted-foreground"> · not spendable</span>}
            </span>
            <span aria-hidden="true" className="ldr-leader min-w-3" />
            <span className="shrink-0 font-mono tabular-nums">{money(balance, { whole: true })}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-baseline gap-2 border-t border-border pt-2 text-sm font-medium">
        <span>Total</span>
        <span aria-hidden="true" className="ldr-leader min-w-3" />
        <span className="font-mono tabular-nums">{money(total, { whole: true })}</span>
      </div>
    </section>
  )
}
