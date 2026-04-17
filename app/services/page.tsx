import { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CTA } from "@/components/sections/cta"
import { 
  Wallet, 
  Calculator, 
  BarChart3, 
  FileText, 
  Brain,
  Check,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Services | Cashlytics",
  description: "Explore our comprehensive financial services including income tracking, tax automation, analytics, invoice management, and AI assistance.",
}

const services = [
  {
    id: "tracking",
    icon: Wallet,
    title: "Income & Expense Tracking",
    description: "Automatically track and categorize every transaction across all your accounts in real-time.",
    features: [
      "Automatic bank sync",
      "Multi-currency support",
      "Smart categorization",
      "Receipt scanning",
      "Custom categories",
      "Transaction search",
    ],
    benefits: [
      "Save 5+ hours per week on manual entry",
      "Never miss a deductible expense",
      "Real-time financial visibility",
    ],
    price: "$9/mo",
  },
  {
    id: "tax",
    icon: Calculator,
    title: "Tax Automation",
    description: "Stay on top of your tax obligations with real-time calculations and smart deduction tracking.",
    features: [
      "Real-time tax estimates",
      "Quarterly payment reminders",
      "Deduction optimization",
      "Tax form preparation",
      "Multi-state support",
      "Audit trail",
    ],
    benefits: [
      "Reduce tax prep time by 80%",
      "Maximize deductions automatically",
      "Avoid costly surprises at tax time",
    ],
    price: "$15/mo",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Financial Analytics",
    description: "Transform your financial data into actionable insights with powerful visualizations and reports.",
    features: [
      "Custom dashboards",
      "Trend analysis",
      "Cash flow forecasting",
      "Budget tracking",
      "Goal monitoring",
      "Export reports",
    ],
    benefits: [
      "Make data-driven financial decisions",
      "Identify spending patterns",
      "Track progress toward goals",
    ],
    price: "$12/mo",
  },
  {
    id: "invoices",
    icon: FileText,
    title: "Invoice Management",
    description: "Create, send, and track professional invoices with automated reminders and payment tracking.",
    features: [
      "Professional templates",
      "Automatic reminders",
      "Online payments",
      "Recurring invoices",
      "Client portal",
      "Payment tracking",
    ],
    benefits: [
      "Get paid 2x faster on average",
      "Reduce late payments by 60%",
      "Professional client experience",
    ],
    price: "$10/mo",
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI Financial Assistant",
    description: "Get personalized financial insights and recommendations powered by advanced AI.",
    features: [
      "Smart categorization",
      "Anomaly detection",
      "Spending insights",
      "Savings suggestions",
      "Natural language queries",
      "Predictive analytics",
    ],
    benefits: [
      "Uncover hidden savings opportunities",
      "Catch errors automatically",
      "Personalized financial advice",
    ],
    price: "$20/mo",
  },
]

const bundlePlan = {
  name: "All-in-One Plan",
  originalPrice: "$66",
  price: "$49",
  description: "Get all services bundled together at a 25% discount",
  features: [
    "Income & Expense Tracking",
    "Tax Automation",
    "Financial Analytics",
    "Invoice Management",
    "AI Financial Assistant",
    "Priority Support",
    "Advanced Integrations",
  ],
}

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Our Services
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
                Powerful tools for complete financial control
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Choose individual services or bundle them together for the complete 
                financial management experience.
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="space-y-16">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  id={service.id}
                  className={`flex flex-col gap-12 lg:flex-row lg:items-start ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                      <service.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">
                      {service.title}
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                      {service.description}
                    </p>
                    
                    <h3 className="mt-8 font-semibold text-foreground">Key Features</h3>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-5 w-5 shrink-0 text-accent" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="mt-8 font-semibold text-foreground">Benefits</h3>
                    <ul className="mt-4 space-y-2">
                      {service.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2">
                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 flex items-center gap-4">
                      <span className="text-2xl font-bold text-foreground">{service.price}</span>
                      <Button className="bg-primary hover:bg-primary/90">
                        Get Started
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <ServicePreview service={service} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bundle Section */}
        <section className="bg-secondary/50 py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-2xl border border-primary bg-card p-8 shadow-lg lg:p-12">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
                
                <div className="relative">
                  <div className="inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                    Best Value
                  </div>
                  <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
                    {bundlePlan.name}
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    {bundlePlan.description}
                  </p>

                  <div className="mt-8 flex items-baseline gap-3">
                    <span className="text-xl text-muted-foreground line-through">
                      {bundlePlan.originalPrice}
                    </span>
                    <span className="text-5xl font-bold text-foreground">
                      {bundlePlan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {bundlePlan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className="h-5 w-5 shrink-0 text-accent" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                      <Link href="/pricing">
                        Start Free Trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline">
                      Schedule Demo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </>
  )
}

function ServicePreview({ service }: { service: typeof services[0] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <span className="ml-2 text-sm text-muted-foreground">{service.title}</span>
      </div>
      <div className="pt-6">
        {service.id === "tracking" && <TrackingPreview />}
        {service.id === "tax" && <TaxPreview />}
        {service.id === "analytics" && <AnalyticsPreview />}
        {service.id === "invoices" && <InvoicePreview />}
        {service.id === "ai" && <AIPreview />}
      </div>
    </div>
  )
}

function TrackingPreview() {
  return (
    <div className="space-y-3">
      {[
        { name: "Stripe Payment", amount: "+$2,400.00", category: "Income" },
        { name: "AWS Services", amount: "-$156.00", category: "Software" },
        { name: "Client Invoice #124", amount: "+$1,850.00", category: "Income" },
        { name: "Adobe Creative", amount: "-$54.99", category: "Subscription" },
      ].map((tx, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
          <div>
            <p className="font-medium text-foreground">{tx.name}</p>
            <p className="text-xs text-muted-foreground">{tx.category}</p>
          </div>
          <p className={tx.amount.startsWith("+") ? "font-semibold text-accent" : "font-semibold text-foreground"}>
            {tx.amount}
          </p>
        </div>
      ))}
    </div>
  )
}

function TaxPreview() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-secondary/50 p-4">
        <p className="text-sm text-muted-foreground">Estimated Tax (2024)</p>
        <p className="mt-1 text-3xl font-bold text-foreground">$12,450</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-accent/10 p-3">
          <p className="text-xs text-muted-foreground">Q1 Paid</p>
          <p className="font-semibold text-accent">$3,100</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="text-xs text-muted-foreground">Q2 Due</p>
          <p className="font-semibold text-primary">$3,112</p>
        </div>
      </div>
      <div className="rounded-lg border border-border p-3">
        <p className="text-sm font-medium text-foreground">Deductions Found</p>
        <p className="text-2xl font-bold text-accent">$8,240</p>
      </div>
    </div>
  )
}

function AnalyticsPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        {[35, 45, 30, 60, 45, 75, 65, 80, 70, 90, 85, 95].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary to-accent" style={{ height: `${h}px` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="font-semibold text-foreground">$48,350</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="font-semibold text-foreground">$12,840</p>
        </div>
      </div>
    </div>
  )
}

function InvoicePreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Invoice #INV-0124</p>
            <p className="text-sm text-muted-foreground">Acme Corp</p>
          </div>
          <span className="rounded-full bg-accent/20 px-2 py-1 text-xs font-medium text-accent">
            Paid
          </span>
        </div>
        <p className="mt-2 text-lg font-bold text-foreground">$4,500.00</p>
      </div>
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Invoice #INV-0125</p>
            <p className="text-sm text-muted-foreground">TechStart Inc</p>
          </div>
          <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-600">
            Pending
          </span>
        </div>
        <p className="mt-2 text-lg font-bold text-foreground">$2,800.00</p>
      </div>
    </div>
  )
}

function AIPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-primary/5 p-3">
        <p className="text-sm font-medium text-primary">Insight</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {"Your software subscriptions increased 23% this quarter. Consider reviewing for unused services."}
        </p>
      </div>
      <div className="rounded-lg bg-accent/5 p-3">
        <p className="text-sm font-medium text-accent">Savings Opportunity</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {"Potential $420/year savings by switching your cloud provider."}
        </p>
      </div>
      <div className="rounded-lg bg-secondary p-3">
        <p className="text-sm font-medium text-foreground">Ask AI</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {"\"What were my top expenses last month?\""}
        </p>
      </div>
    </div>
  )
}
