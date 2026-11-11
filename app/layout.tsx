import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Caveat, DM_Mono, Schibsted_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { InViewObserver } from '@/components/motion/in-view-observer'
import './globals.css'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  axes: ['opsz', 'wdth'],
  display: 'swap',
})

const sans = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-schibsted',
  display: 'swap',
})

const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const hand = Caveat({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-caveat',
  display: 'swap',
})

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Cashlytics — Manage · Plan · Learn',
  description:
    'A concept prototype for managing income and expenses, estimating tax as you earn and finding the weak spots in your money strategy. Live demo in your browser, fictional data, no sign-up.',
  openGraph: {
    siteName: 'Cashlytics',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2eee6' },
    { media: '(prefers-color-scheme: dark)', color: '#12110e' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} ${hand.variable} bg-background`}
      suppressHydrationWarning
    >
      <head>
        {/* Starts the first-screen entrance on the second frame, without waiting for hydration. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var b=function(){document.documentElement.setAttribute('data-boot','')};requestAnimationFrame(function(){requestAnimationFrame(b)});setTimeout(b,150)})()",
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <InViewObserver />
        </ThemeProvider>
        <div aria-hidden="true" className="paper-grain" />
      </body>
    </html>
  )
}
