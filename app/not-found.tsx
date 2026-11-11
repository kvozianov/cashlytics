import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MarginNote, Stamp } from "@/components/brand"

export const metadata: Metadata = {
  title: "Page not found | Cashlytics",
}

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="flex min-h-[72vh] items-center pt-14">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12">
          <Stamp rotate={-3} size="md" subline="Not in the prototype">
            Error 404
          </Stamp>
          <h1 className="mt-8 max-w-4xl font-display text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.92] font-extrabold tracking-[-0.045em] text-balance">
            This page was never printed.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            The link may be old, or the page was never built. The live demo and the rest of the site are one click
            away.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/demo" className="btn-ink h-14 px-7 text-base">
              Open the live demo <span aria-hidden="true">→</span>
            </Link>
            <Link href="/" className="py-2 font-medium underline decoration-1 underline-offset-[6px] hover:decoration-2">
              Back to the home page
            </Link>
            <MarginNote arrow="left" tone="signal" className="max-sm:hidden">
              start here
            </MarginNote>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
