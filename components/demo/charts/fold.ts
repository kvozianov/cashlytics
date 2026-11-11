import { categoryColor, getCategory } from '@/lib/demo/categories'
import type { CategoryId } from '@/lib/demo/types'

export interface FoldedCategory {
  /** Category id, or `other` for the folded remainder. */
  key: CategoryId | 'other'
  label: string
  total: number
  /** Share of the grand total, 0..1. */
  share: number
  /** CSS colour; unique within the returned list. */
  color: string
  /** Category ids inside this slice (several for `other`). */
  ids: CategoryId[]
}

const SLOTS = Array.from({ length: 12 }, (_, i) => `var(--cat-${i + 1})`)

/**
 * Top `top` categories plus one "Other" slice. Colours follow the category
 * (`categoryColor`), except where two shown categories share a palette slot:
 * the smaller one moves to the first free slot so no two slices look alike.
 */
export function foldCategories(items: readonly { categoryId: CategoryId; total: number }[], top = 7): FoldedCategory[] {
  const sorted = [...items].filter((i) => i.total > 0).sort((a, b) => b.total - a.total)
  const sum = sorted.reduce((s, i) => s + i.total, 0)
  if (sum <= 0) return []
  const head = sorted.length > top + 1 ? sorted.slice(0, top) : sorted
  const tail = sorted.length > top + 1 ? sorted.slice(top) : []
  const used = new Set<string>()
  const out: FoldedCategory[] = head.map((i) => {
    let color = categoryColor(i.categoryId)
    if (used.has(color)) color = SLOTS.find((s) => !used.has(s)) ?? color
    used.add(color)
    return { key: i.categoryId, label: getCategory(i.categoryId).label, total: i.total, share: i.total / sum, color, ids: [i.categoryId] }
  })
  if (tail.length) {
    const total = tail.reduce((s, i) => s + i.total, 0)
    out.push({ key: 'other', label: `Other (${tail.length})`, total, share: total / sum, color: 'var(--muted-foreground)', ids: tail.map((i) => i.categoryId) })
  }
  return out
}
