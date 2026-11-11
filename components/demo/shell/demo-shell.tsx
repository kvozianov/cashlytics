'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { TourProvider, useTour } from '@/components/demo/tour'
import { DemoProvider } from '@/lib/demo/store'

import { CommandPalette } from './command-palette'
import { DemoStrip } from './demo-strip'
import { QuickAddDialog } from './quick-add-dialog'
import { DemoShellContext } from './shell-context'
import { ShellSkeleton } from './shell-skeleton'
import { Sidebar, SidebarContent } from './sidebar'
import { TopBar } from './top-bar'

function ShellFrame({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [quickAddText, setQuickAddText] = useState('')
  const { start: startTour } = useTour()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const shell = useMemo(
    () => ({
      // Pages pass this straight to onClick, so ignore anything that is not text.
      openQuickAdd: (text?: unknown) => {
        setQuickAddText(typeof text === 'string' ? text : '')
        setQuickAddOpen(true)
      },
      openCommandPalette: () => setPaletteOpen(true),
      startTour,
    }),
    [startTour],
  )

  return (
    <DemoShellContext.Provider value={shell}>
      <a
        href="#demo-main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      {/* --demo-topbar-h: height of the sticky top bar, for anything that sticks below it. */}
      <div className="flex min-h-dvh bg-background [--demo-topbar-h:6.625rem] sm:[--demo-topbar-h:3.5625rem]">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DemoStrip />
          <TopBar onOpenMenu={() => setMenuOpen(true)} onQuickAdd={shell.openQuickAdd} onCommandPalette={shell.openCommandPalette} />
          <main id="demo-main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </div>
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Demo sections</SheetDescription>
          </SheetHeader>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} initialText={quickAddText} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onQuickAdd={shell.openQuickAdd} onStartTour={startTour} />
    </DemoShellContext.Provider>
  )
}

/** Everything around a demo page: data provider, sidebar, top bar, demo notice, dialogs and toasts. */
export function DemoShell({ children }: { children: ReactNode }) {
  return (
    <>
      <DemoProvider fallback={<ShellSkeleton />}>
        <TourProvider>
          <ShellFrame>{children}</ShellFrame>
        </TourProvider>
      </DemoProvider>
      <Toaster position="bottom-right" closeButton />
    </>
  )
}
