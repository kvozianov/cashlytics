'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Printing hides every direct child of <body> except this one, so the app
// chrome, dialogs and the grain overlay never reach the paper. Colours are
// reset to ink on white whatever theme is active.
const PRINT_CSS = `
.invoice-print-root { display: none; }
@media print {
  @page { margin: 14mm 12mm; }
  html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
  body > *:not(.invoice-print-root) { display: none !important; }
  .invoice-print-root {
    display: block !important;
    --background: #fff; --card: #fff; --card-foreground: #14130f; --foreground: #14130f;
    --muted-foreground: #4d4a42; --border: #14130f33; --destructive: #bf3418; --success: #0e7c4a; --stamp: #bf3418;
    color: #14130f;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .invoice-print-root .invoice-paper { border: 0 !important; box-shadow: none !important; max-width: 100%; }
  .invoice-print-root .stamp { animation: none !important; opacity: 1 !important; }
}
`

const subscribe = () => () => {}

/** Renders `children` straight into <body>, visible only when printing. */
export function PrintPortal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  return (
    <>
      <style href="cashlytics-invoice-print" precedence="default">
        {PRINT_CSS}
      </style>
      {mounted && createPortal(<div className="invoice-print-root">{children}</div>, document.body)}
    </>
  )
}
