'use client'

import { useEffect } from 'react'

/**
 * Demo pages render after the store loads, so the browser's own jump to `#id`
 * happens before the target exists. Scroll there once it does, and briefly mark it.
 */
export function useHashScroll(ids: readonly string[]) {
  const key = ids.join('|')
  useEffect(() => {
    const known = new Set(key.split('|'))
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!id || !known.has(id)) return
      const el = document.getElementById(id)
      if (!el) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      el.setAttribute('data-flash', '')
      window.setTimeout(() => el.removeAttribute('data-flash'), 1600)
    }
    // Retry briefly: the target may be inside a panel that opens on the same hash.
    let tries = 0
    let t = 0
    const attempt = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!known.has(id)) return
      if (document.getElementById(id)) go()
      else if (++tries < 10) t = window.setTimeout(attempt, 60)
    }
    t = window.setTimeout(attempt, 60)
    const onHash = () => {
      tries = 0
      t = window.setTimeout(attempt, 60)
    }
    window.addEventListener('hashchange', onHash)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('hashchange', onHash)
    }
  }, [key])
}
