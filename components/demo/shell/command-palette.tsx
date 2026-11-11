'use client'

import { BookOpen, Compass, FileText, Info, Monitor, Moon, Plus, Receipt, RotateCcw, Sun, UserRound, type LucideIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { formatDate, money, signedMoney } from '@/lib/demo/format'
import { PERSONA_IDS, PERSONAS } from '@/lib/demo/personas'
import { matchesQuery, MIN_SEARCH_LENGTH, normaliseQuery, parseAddCommand, searchInvoices, searchLessons, searchTransactions } from '@/lib/demo/search'
import { useDemo } from '@/lib/demo/store'

import { DEMO_NAV } from './nav'
import { useDemoNavigate } from './navigate'

interface Action {
  id: string
  label: string
  keywords: string
  icon: LucideIcon
  run: () => void
  /** Listed before anything is typed. */
  pinned?: boolean
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuickAdd: (text?: string) => void
  onStartTour: () => void
}

/**
 * ⌘K palette. Empty: pages and three actions. Typing narrows those and, from two characters,
 * adds lessons, transactions and invoices (five each). `add coffee 4.50` goes to quick add.
 */
export function CommandPalette({ open, onOpenChange, onQuickAdd, onStartTour }: CommandPaletteProps) {
  const navigate = useDemoNavigate()
  const { setTheme } = useTheme()
  const { state, today, persona, actions } = useDemo()
  const [query, setQuery] = useState('')

  // Start empty each time it opens.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setQuery('')
  }

  const run = (fn: () => void) => {
    onOpenChange(false)
    fn()
  }

  const words = normaliseQuery(query)
  const typing = words.length > 0
  const addLine = parseAddCommand(query)
  const searchQuery = addLine ? '' : query

  const pages = [...DEMO_NAV.map((n) => ({ href: n.href, label: n.label, icon: n.icon })), { href: '/demo/about', label: 'How this demo works', icon: Info }].filter(
    (p) => !typing || matchesQuery(`${p.label} go page`, words),
  )

  const allActions: Action[] = [
    { id: 'add', label: 'Quick add a transaction', keywords: 'add new transaction expense income', icon: Plus, run: () => onQuickAdd(), pinned: true },
    { id: 'tour', label: 'Start the tour', keywords: 'tour guide help start walkthrough', icon: Compass, run: onStartTour, pinned: true },
    { id: 'reset', label: `Reset demo data for ${persona.name}`, keywords: 'reset demo data clear start over', icon: RotateCcw, run: () => actions.reset(), pinned: true },
    ...PERSONA_IDS.filter((id) => id !== persona.id).map((id) => ({
      id: `persona-${id}`,
      label: `Switch to ${PERSONAS[id].name}`,
      keywords: `switch persona ${PERSONAS[id].name} ${PERSONAS[id].role}`,
      icon: UserRound,
      run: () => actions.switchPersona(id),
    })),
    { id: 'light', label: 'Light theme', keywords: 'theme light paper', icon: Sun, run: () => setTheme('light') },
    { id: 'dark', label: 'Dark theme', keywords: 'theme dark ink', icon: Moon, run: () => setTheme('dark') },
    { id: 'system', label: 'Match system theme', keywords: 'theme system auto', icon: Monitor, run: () => setTheme('system') },
  ]
  const shownActions = addLine ? [] : typing ? allActions.filter((a) => matchesQuery(`${a.label} ${a.keywords}`, words)) : allActions.filter((a) => a.pinned)

  const lessons = useMemo(() => searchLessons(searchQuery), [searchQuery])
  const transactions = useMemo(() => searchTransactions(state, searchQuery), [state, searchQuery])
  const invoices = useMemo(() => searchInvoices(state, searchQuery, today), [state, searchQuery, today])

  const groups = [
    addLine && (
      <CommandGroup key="add" heading="Quick add">
        <CommandItem value="add-line" onSelect={() => run(() => onQuickAdd(addLine))}>
          <Plus aria-hidden="true" />
          Add “{addLine}”
        </CommandItem>
      </CommandGroup>
    ),
    !addLine && pages.length > 0 && (
      <CommandGroup key="pages" heading="Go to">
        {pages.map((p) => (
          <CommandItem key={p.href} value={`page ${p.href}`} onSelect={() => run(() => navigate(p.href))}>
            <p.icon aria-hidden="true" />
            {p.label}
          </CommandItem>
        ))}
      </CommandGroup>
    ),
    shownActions.length > 0 && (
      <CommandGroup key="actions" heading="Actions">
        {shownActions.map((a) => (
          <CommandItem key={a.id} value={`action ${a.id}`} onSelect={() => run(a.run)}>
            <a.icon aria-hidden="true" />
            {a.label}
          </CommandItem>
        ))}
      </CommandGroup>
    ),
    lessons.length > 0 && (
      <CommandGroup key="lessons" heading="Lessons">
        {lessons.map((l) => (
          <CommandItem key={l.id} value={`lesson ${l.id}`} onSelect={() => run(() => navigate(`/demo/learn?lesson=${l.id}`))}>
            <BookOpen aria-hidden="true" />
            {l.title}
          </CommandItem>
        ))}
      </CommandGroup>
    ),
    transactions.length > 0 && (
      <CommandGroup key="transactions" heading="Transactions">
        {transactions.map((t) => (
          <CommandItem key={t.id} value={`tx ${t.id}`} onSelect={() => run(() => navigate(`/demo/transactions?range=all&tx=${encodeURIComponent(t.id)}`, { scroll: false }))}>
            <Receipt aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{t.merchant}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {formatDate(t.date)} · {signedMoney(t.amount)}
            </span>
          </CommandItem>
        ))}
      </CommandGroup>
    ),
    invoices.length > 0 && (
      <CommandGroup key="invoices" heading="Invoices">
        {invoices.map((h) => (
          <CommandItem key={h.invoice.id} value={`invoice ${h.invoice.id}`} onSelect={() => run(() => navigate(`/demo/invoices?invoice=${encodeURIComponent(h.invoice.id)}`, { scroll: false }))}>
            <FileText aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">
              {h.invoice.number} · {h.clientName}
            </span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {h.status} · {money(h.total, { whole: true })}
            </span>
          </CommandItem>
        ))}
      </CommandGroup>
    ),
  ].filter(Boolean)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false} title="Command palette" description="Jump to a page, search your data or run an action">
      <CommandInput placeholder="Search, or type “add coffee 4.50”" value={query} onValueChange={setQuery} />
      <CommandList className="max-h-[min(30rem,60dvh)]">
        <CommandEmpty>{query.trim().length < MIN_SEARCH_LENGTH ? 'Keep typing to search transactions, invoices and lessons.' : 'Nothing matches.'}</CommandEmpty>
        {groups.flatMap((g, i) => (i === 0 ? [g] : [<CommandSeparator key={`sep-${i}`} />, g]))}
      </CommandList>
    </CommandDialog>
  )
}
