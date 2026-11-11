import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SmoothScroll } from "@/components/motion/smooth-scroll"
import { Hero } from "@/components/sections/hero"
import { TickerBand } from "@/components/sections/ticker-band"
import { StatementScene } from "@/components/sections/statement-scene"
import { PreviewPlate } from "@/components/sections/preview-plate"
import { ChapterManage } from "@/components/sections/chapter-manage"
import { ChapterPlan } from "@/components/sections/chapter-plan"
import { ChapterLearn } from "@/components/sections/chapter-learn"
import { Personas } from "@/components/sections/personas"
import { Problems } from "@/components/sections/problems"
import { PricingPreview } from "@/components/sections/pricing-preview"
import { CTA } from "@/components/sections/cta"

export const metadata: Metadata = {
  title: "Cashlytics — Manage · Plan · Learn",
  description:
    "A concept prototype for managing income and expenses, estimating tax as you earn and finding the weak spots in your money strategy. Live demo in your browser, fictional data, no sign-up.",
}

export default function HomePage() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main id="main">
        <Hero />
        <TickerBand />
        <StatementScene />
        <PreviewPlate />
        <ChapterManage />
        <ChapterPlan />
        <ChapterLearn />
        <Personas />
        <Problems />
        <PricingPreview />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
