'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { EMPTY_FILTERS, parseLedgerParams, toLedgerSearch, type LedgerFilters, type LedgerUrlState, type View } from './ledger-utils'

/**
 * Filters, tab, page and the open transaction, mirrored into the query string.
 * State updates are instant; the URL follows a moment later so typing stays smooth.
 */
export function useLedgerState() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const search = searchParams.toString()
  const [ui, setUi] = useState<LedgerUrlState>(() => parseLedgerParams(new URLSearchParams(search)))
  const [seen, setSeen] = useState(search)
  const [written, setWritten] = useState(search)

  // Someone else changed the URL (a link, the command palette, back/forward): follow it.
  if (search !== seen) {
    setSeen(search)
    if (search !== written) setUi(parseLedgerParams(new URLSearchParams(search)))
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      const current = new URLSearchParams(window.location.search)
      current.delete('new')
      const next = toLedgerSearch(ui, current)
      if (next === window.location.search) return
      setWritten(next.replace(/^\?/, ''))
      window.history.replaceState(null, '', `${pathname}${next}${window.location.hash}`)
    }, 250)
    return () => window.clearTimeout(t)
  }, [ui, pathname])

  const setFilters = useCallback((patch: Partial<LedgerFilters>) => {
    setUi((s) => ({ ...s, filters: { ...s.filters, ...patch }, page: 1 }))
  }, [])
  const resetFilters = useCallback((keep: Partial<LedgerFilters> = {}) => {
    setUi((s) => ({ ...s, filters: { ...EMPTY_FILTERS, sort: s.filters.sort, ...keep }, page: 1 }))
  }, [])
  const setView = useCallback((view: View) => setUi((s) => ({ ...s, view })), [])
  const setPage = useCallback((page: number) => setUi((s) => ({ ...s, page })), [])
  const openTx = useCallback((tx: string | null) => setUi((s) => ({ ...s, tx })), [])

  return { ui, search, setFilters, resetFilters, setView, setPage, openTx }
}
