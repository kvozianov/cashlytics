import { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Check, X, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Pricing | Cashlytics",
  description: "Simple, transparent pricing for individuals and businesses. Start your 14-day free trial today.",
}

const plans = [
  {
    name: "Basic",
    description: "Perfect for individuals just getting started",
    price: "$9",
    billing: "per month",
    features: [
      { name: "Income & expense tracking", included: true },
      { name: "Basic analytics dashboard", included: true },
      { name: "5 invoices per month", included: true },
      { name: "Bank account sync (2 accounts)", included: true },
      { name: "Mobile app access", included: true },
      { name: "Email support", included: true },
      { name: "Tax calculations", included: false },
      { name: "AI categorization", included: false },
      { name: "Unlimited invoices", included: false },
      { name: "Team access", included: false },
      { name: "Priority support", included: false },
      { name: "Custom reports", included: false },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    description: "For growing freelancers and consultants",
    price: "$29",
    billing: "per month",
    features: [
      { name: "Income & expense tracking", included: true },
      { name: "Advanced analytics dashboard", included: true },
      { name: "Unlimited invoices", included: true },
      { name: "Bank account sync (unlimited)", included: true },
      { name: "Mobile app access", included: true },
      { name: "Priority email support", included: true },
      { name: "Tax calculations", included: true },
      { name: "AI categorization", included: true },
      { name: "Receipt scanning", included: true },
      { name: "Team access", included: false },
      { name: "Custom reports", included: false },
      { name: "API access", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Business",
    description: "For small businesses and teams",
    price: "$79",
    billing: "per month",
    features: [
      { name: "Income & expense tracking", included: true },
      { name: "Advanced analytics dashboard", included: true },
      { name: "Unlimited invoices", included: true },
      { name: "Bank account sync (unlimited)", included: true },
      { name: "Mobile app access", included: true },
      { name: "Priority phone & email support", included: true },
      { name: "Tax calculations", included: true },
      { name: "AI categorization", included: true },
      { name: "Receipt scanning", included: true },
      { name: "Team access (up to 10 users)", included: true },
      { name: "Custom reports", included: true },
      { name: "API access", included: true },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
]

const comparisonFeatures = [
  {
    category: "Core Features",
    features: [
      { name: "Income tracking", basic: true, pro: true, business: true },
      { name: "Expense tracking", basic: true, pro: true, business: true },
      { name: "Bank sync", basic: "2 accounts", pro: "Unlimited", business: "Unlimited" },
      { name: "Mobile app", basic: true, pro: true, business: true },
      { name: "Receipt scanning", basic: false, pro: true, business: true },
    ],
  },
  {
    category: "Invoicing",
    features: [
      { name: "Create invoices", basic: true, pro: true, business: true },
      { name: "Monthly limit", basic: "5", pro: "Unlimited", business: "Unlimited" },
      { name: "Payment reminders", basic: false, pro: true, business: true },
      { name: "Recurring invoices", basic: false, pro: true, business: true },
      { name: "Client portal", basic: false, pro: false, business: true },
    ],
  },
  {
    category: "Tax & Compliance",
    features: [
      { name: "Tax estimates", basic: false, pro: true, business: true },
      { name: "Quarterly reminders", basic: false, pro: true, business: true },
      { name: "Deduction tracking", basic: false, pro: true, business: true },
      { name: "Multi-state support", basic: false, pro: false, business: true },
      { name: "Audit trail", basic: false, pro: false, business: true },
    ],
  },
  {
    category: "Analytics & AI",
    features: [
      { name: "Basic dashboard", basic: true, pro: true, business: true },
      { name: "Advanced analytics", basic: false, pro: true, business: true },
      { name: "AI categorization", basic: false, pro: true, business: true },
      { name: "Custom reports", basic: false, pro: false, business: true },
      { name: "Forecasting", basic: false, pro: false, business: true },
    ],
  },
  {
    category: "Team & Support",
    features: [
      { name: "Team members", basic: "1", pro: "1", business: "Up to 10" },
      { name: "Email support", basic: true, pro: true, business: true },
      { name: "Priority support", basic: false, pro: true, business: true },
      { name: "Phone support", basic: false, pro: false, business: true },
      { name: "Dedicated manager", basic: false, pro: false, business: "Add-on" },
    ],
  },
]

const faqs = [
  {
    question: "Can I switch plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! All plans include a 14-day free trial with full access to features. No credit card required to start.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. You can cancel your subscription at any time with no cancellation fees.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes, you save 20% when you choose annual billing on any plan.",
  },
  {
    question: "Is my data secure?",
    answer: "Your data is encrypted with bank-level security (256-bit SSL). We never sell your data to third parties.",
  },
]

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Pricing
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
                Simple, transparent pricing
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Choose the plan that fits your needs. All plans include a 14-day free trial 
                with no credit card required.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <span className="text-sm text-muted-foreground">Monthly</span>
                <div className="relative h-6 w-11 rounded-full bg-primary/20">
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Annual <span className="text-accent">(Save 20%)</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border bg-card p-8 shadow-sm ${
                    plan.popular
                      ? "border-primary ring-2 ring-primary"
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
                        Best Value
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                    <p className="mt-6">
                      <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.billing}</span>
                    </p>
                  </div>

                  <Button
                    className={`mt-8 w-full ${
                      plan.popular
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.cta}
                  </Button>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        ) : (
                          <X className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="bg-secondary/50 py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Compare plans in detail
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                See exactly what you get with each plan
              </p>
            </div>

            <div className="mt-16 overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-4 pr-4"></th>
                    <th className="px-6 py-4 text-center">
                      <span className="text-lg font-semibold text-foreground">Basic</span>
                      <p className="text-sm text-muted-foreground">$9/mo</p>
                    </th>
                    <th className="px-6 py-4 text-center rounded-t-lg bg-primary/5">
                      <span className="text-lg font-semibold text-primary">Pro</span>
                      <p className="text-sm text-muted-foreground">$29/mo</p>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <span className="text-lg font-semibold text-foreground">Business</span>
                      <p className="text-sm text-muted-foreground">$79/mo</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category) => (
                    <>
                      <tr key={category.category}>
                        <td colSpan={4} className="pt-8 pb-2">
                          <span className="font-semibold text-foreground">{category.category}</span>
                        </td>
                      </tr>
                      {category.features.map((feature) => (
                        <tr key={feature.name} className="border-b border-border">
                          <td className="py-4 pr-4 text-muted-foreground">{feature.name}</td>
                          <td className="px-6 py-4 text-center">
                            <FeatureValue value={feature.basic} />
                          </td>
                          <td className="px-6 py-4 text-center bg-primary/5">
                            <FeatureValue value={feature.pro} />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <FeatureValue value={feature.business} />
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know about our pricing
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">{faq.question}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-secondary/50 py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start your 14-day free trial today. No credit card required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-accent" />
    ) : (
      <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
    )
  }
  return <span className="text-sm text-foreground">{value}</span>
}
