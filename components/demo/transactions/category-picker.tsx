'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { CategoryIcon } from '@/components/demo/ui'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { categoryColor, categoryOptions, getCategory } from '@/lib/demo/categories'
import type { CategoryId } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

const OPTIONS = categoryOptions()

interface CategoryPickerProps {
  /** Single choice: the selected id. */
  value?: CategoryId | null
  /** Multi choice: the selected ids (the list stays open). */
  values?: CategoryId[]
  onSelect: (id: CategoryId) => void
  /** Custom trigger content; defaults to the selected category. */
  children?: ReactNode
  placeholder?: string
  id?: string
  className?: string
  align?: 'start' | 'end' | 'center'
  'aria-label'?: string
  includeUncategorised?: boolean
}

/** Searchable category combobox, grouped like the catalogue (income, business, personal, other). */
export function CategoryPicker({
  value,
  values,
  onSelect,
  children,
  placeholder = 'Choose a category',
  id,
  className,
  align = 'start',
  includeUncategorised = false,
  ...rest
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const multi = values !== undefined
  const selected = (cid: CategoryId) => (multi ? values.includes(cid) : value === cid)
  const groups = includeUncategorised
    ? [...OPTIONS.slice(0, 3), { label: 'Other', categories: [...OPTIONS[3].categories, getCategory('uncategorised')] }]
    : OPTIONS

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={rest['aria-label']}
          className={cn('justify-between gap-2 font-normal', className)}
        >
          {children ??
            (value ? (
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(value) }} />
                <CategoryIcon categoryId={value} className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{getCategory(value).label}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            ))}
          <ChevronsUpDown aria-hidden="true" className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[min(18rem,calc(100vw-2rem))] p-0">
        <Command>
          <CommandInput placeholder="Search categories…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No category found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.categories.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.label} ${c.id}`}
                    onSelect={() => {
                      onSelect(c.id)
                      if (!multi) setOpen(false)
                    }}
                    className="gap-2"
                  >
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(c.id) }} />
                    <CategoryIcon categoryId={c.id} className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{c.label}</span>
                    <Check aria-hidden="true" className={cn('size-3.5', selected(c.id) ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
