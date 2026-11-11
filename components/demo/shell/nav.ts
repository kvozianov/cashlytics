import { ArrowLeftRight, BookOpen, Calculator, FileText, Lightbulb, LayoutDashboard, Target, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Pillar from the pitch: Manage · Plan · Learn. */
  pillar: 'Manage' | 'Plan' | 'Learn'
}

export const DEMO_NAV: NavItem[] = [
  { href: '/demo', label: 'Overview', icon: LayoutDashboard, pillar: 'Manage' },
  { href: '/demo/transactions', label: 'Transactions', icon: ArrowLeftRight, pillar: 'Manage' },
  { href: '/demo/invoices', label: 'Invoices', icon: FileText, pillar: 'Manage' },
  { href: '/demo/tax', label: 'Tax', icon: Calculator, pillar: 'Plan' },
  { href: '/demo/plan', label: 'Budgets & goals', icon: Target, pillar: 'Plan' },
  { href: '/demo/insights', label: 'Insights', icon: Lightbulb, pillar: 'Plan' },
  { href: '/demo/learn', label: 'Learn', icon: BookOpen, pillar: 'Learn' },
]

export function isActive(pathname: string, href: string): boolean {
  return href === '/demo' ? pathname === '/demo' : pathname === href || pathname.startsWith(`${href}/`)
}

export function pageTitle(pathname: string): string {
  if (pathname.startsWith('/demo/about')) return 'How this demo works'
  return DEMO_NAV.find((n) => isActive(pathname, n.href))?.label ?? 'Demo'
}
