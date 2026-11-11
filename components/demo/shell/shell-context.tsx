'use client'

import { createContext, useContext } from 'react'

export interface DemoShellContextValue {
  /** Opens quick add, optionally prefilled with a one-line entry such as `coffee 4.50`. */
  openQuickAdd: (text?: string) => void
  openCommandPalette: () => void
  startTour: () => void
}

export const DemoShellContext = createContext<DemoShellContextValue>({
  openQuickAdd: () => {},
  openCommandPalette: () => {},
  startTour: () => {},
})

/** Opens the shell's quick-add dialog, command palette or guided tour from any demo page. */
export function useDemoShell(): DemoShellContextValue {
  return useContext(DemoShellContext)
}
