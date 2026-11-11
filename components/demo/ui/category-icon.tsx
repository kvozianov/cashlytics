import { createElement } from 'react'
import {
  AppWindow,
  ArrowLeftRight,
  BadgeDollarSign,
  Briefcase,
  Building2,
  Car,
  CircleHelp,
  Coffee,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  Megaphone,
  Package,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  Scale,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Ticket,
  Users,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { getCategory } from '@/lib/demo/categories'
import type { CategoryId } from '@/lib/demo/types'

const ICONS: Record<string, LucideIcon> = {
  AppWindow,
  ArrowLeftRight,
  BadgeDollarSign,
  Briefcase,
  Building2,
  Car,
  CircleHelp,
  Coffee,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  Megaphone,
  Package,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  Scale,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Ticket,
  Users,
  Wifi,
  Zap,
}

/** The lucide icon component for a category. */
export function categoryIcon(categoryId: CategoryId | string): LucideIcon {
  return ICONS[getCategory(categoryId).icon] ?? CircleHelp
}

/** Category icon, decorative (the label carries the meaning). */
export function CategoryIcon({ categoryId, className }: { categoryId: CategoryId | string; className?: string }) {
  return createElement(categoryIcon(categoryId), { 'aria-hidden': true, className })
}
