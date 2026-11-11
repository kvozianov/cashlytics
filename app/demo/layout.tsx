import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { DemoShell } from '@/components/demo/shell'

export const metadata: Metadata = {
  title: 'Live demo · Cashlytics',
  description: 'A clickable Cashlytics demo running entirely in your browser on fictional data.',
  robots: { index: true, follow: true },
}

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <DemoShell>{children}</DemoShell>
}
