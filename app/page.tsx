import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/sections/hero"
import { About } from "@/components/sections/about"
import { Problems } from "@/components/sections/problems"
import { Solutions } from "@/components/sections/solutions"
import { Features } from "@/components/sections/features"
import { WhyChooseUs } from "@/components/sections/why-choose-us"
import { PricingPreview } from "@/components/sections/pricing-preview"
import { CTA } from "@/components/sections/cta"

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Problems />
        <Solutions />
        <Features />
        <WhyChooseUs />
        <PricingPreview />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
