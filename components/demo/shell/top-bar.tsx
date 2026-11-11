'use client'

import { usePathname } from 'next/navigation'
import { Menu, Plus, Search } from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'

import { pageTitle } from './nav'
import { PeriodSelect } from './period-select'
import { PersonaSwitcher } from './persona-switcher'

interface TopBarProps {
  onOpenMenu: () => void
  onQuickAdd: () => void
  onCommandPalette: () => void
}

/** Page title, period filter and global controls. */
export function TopBar({ onOpenMenu, onQuickAdd, onCommandPalette }: TopBarProps) {
  const pathname = usePathname()
  return (
    <div className="sticky top-0 z-30 flex h-(--demo-topbar-h) flex-col border-b border-border bg-background/95 supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur-sm">
      <div className="flex h-14 shrink-0 items-center gap-2 px-3 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
        <p className="min-w-0 flex-1 truncate font-display text-base font-semibold tracking-tight sm:text-lg" aria-hidden="true">
          {pageTitle(pathname)}
        </p>
        <PeriodSelect className="hidden w-[9.5rem] sm:flex" />
        <Button variant="outline" size="sm" onClick={onCommandPalette} className="hidden gap-2 text-muted-foreground md:inline-flex" aria-label="Open command palette">
          <Search aria-hidden="true" className="size-3.5" />
          <span>Search</span>
          <Kbd className="ml-1">⌘K</Kbd>
        </Button>
        <Button variant="ghost" size="icon" onClick={onCommandPalette} className="md:hidden" aria-label="Open command palette">
          <Search className="size-4" />
        </Button>
        <Button size="sm" onClick={onQuickAdd} className="gap-1.5" aria-label="Quick add a transaction">
          <Plus aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
        <ThemeToggle />
        <PersonaSwitcher />
      </div>
      <div className="flex flex-1 items-center gap-2 border-t border-border px-3 sm:hidden">
        <PeriodSelect className="w-full" />
      </div>
    </div>
  )
}
