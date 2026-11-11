'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ChevronsLeft, ChevronsRight, Info } from 'lucide-react'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { HealthBadge } from './health-badge'
import { SidebarNav } from './sidebar-nav'

/** Sidebar contents, shared by the desktop rail and the mobile sheet. */
export function SidebarContent({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  // Overview and Insights show the score themselves; one figure, one place.
  const pathname = usePathname()
  const showsScore = pathname === '/demo' || pathname.startsWith('/demo/insights')
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-4">
      <div className={cn('flex h-9 items-center px-1', collapsed && 'justify-center px-0')}>
        <Logo href="/demo" markOnly={collapsed} markClassName="h-7 w-7" />
      </div>
      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      <div className="mt-auto space-y-2">
        {!showsScore && <HealthBadge collapsed={collapsed} />}
        <Link
          href="/demo/about"
          onClick={onNavigate}
          title={collapsed ? 'How this demo works' : undefined}
          className={cn(
            'flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
            collapsed && 'justify-center px-0',
          )}
        >
          <Info aria-hidden="true" className="size-4 shrink-0" />
          <span className={cn(collapsed && 'sr-only')}>How this demo works</span>
        </Link>
        <Link
          href="/"
          title={collapsed ? 'Back to site' : undefined}
          className={cn(
            'flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
            collapsed && 'justify-center px-0',
          )}
        >
          <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
          <span className={cn(collapsed && 'sr-only')}>Back to site</span>
        </Link>
      </div>
    </div>
  )
}

/** Desktop sidebar (hidden below `lg`), collapsible to an icon rail. */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 border-r border-border bg-sidebar transition-[width] duration-200 motion-reduce:transition-none lg:block',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        className="absolute top-20 -right-3 size-6 rounded-sm bg-background"
      >
        {collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
      </Button>
    </aside>
  )
}
