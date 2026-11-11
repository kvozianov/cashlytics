'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * Switches themes without every colour transition firing at once. next-themes'
 * own disableTransitionOnChange also fires on mount, which cut the first-screen
 * entrance short, so this only steps in when light/dark actually changes.
 */
function useQuietThemeSwitch(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return
    const html = document.documentElement
    const isDark = (cls: string | null) => (cls ?? '').split(/\s+/).includes('dark')
    const mo = new MutationObserver((records) => {
      if (isDark(records[0].oldValue) === html.classList.contains('dark')) return
      const style = document.createElement('style')
      style.textContent = '*,*::before,*::after{transition:none!important}'
      document.head.appendChild(style)
      void window.getComputedStyle(document.body).opacity
      setTimeout(() => style.remove(), 1)
    })
    mo.observe(html, { attributes: true, attributeFilter: ['class'], attributeOldValue: true })
    return () => mo.disconnect()
  }, [enabled])
}

export function ThemeProvider({ children, disableTransitionOnChange = false, ...props }: ThemeProviderProps) {
  useQuietThemeSwitch(disableTransitionOnChange)
  return (
    <NextThemesProvider {...props} disableTransitionOnChange={false}>
      {children}
    </NextThemesProvider>
  )
}
