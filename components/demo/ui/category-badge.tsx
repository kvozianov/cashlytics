import { categoryColor, getCategory } from '@/lib/demo/categories'
import type { CategoryId } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

import { CategoryIcon } from './category-icon'

export interface CategoryBadgeProps {
  categoryId: CategoryId | string
  /** `sm` for dense tables. */
  size?: 'sm' | 'md'
  /** Hide the text label (it stays available to screen readers). */
  iconOnly?: boolean
  className?: string
}

/** Colour dot + icon + label for a category; colour is never the only signal. */
export function CategoryBadge({ categoryId, size = 'md', iconOnly = false, className }: CategoryBadgeProps) {
  const category = getCategory(categoryId)
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-card text-foreground',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-[13px]',
        iconOnly && 'px-1',
        className,
      )}
      title={iconOnly ? category.label : undefined}
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(category.id) }} />
      <CategoryIcon categoryId={category.id} className={cn('shrink-0 text-muted-foreground', size === 'sm' ? 'size-3' : 'size-3.5')} />
      <span className={cn('truncate', iconOnly && 'sr-only')}>{category.label}</span>
    </span>
  )
}
