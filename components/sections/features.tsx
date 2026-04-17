import { 
  Wallet, 
  Calculator, 
  BarChart3, 
  FileText, 
  Brain,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: Wallet,
    title: "Income & Expense Tracking",
    description: "Connect your accounts and automatically track every transaction in real-time.",
    href: "/services#tracking",
  },
  {
    icon: Calculator,
    title: "Tax Calculation",
    description: "Get accurate tax estimates based on your income, deductions, and filing status.",
    href: "/services#tax",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Visualize your financial data with beautiful charts and actionable insights.",
    href: "/services#analytics",
  },
  {
    icon: FileText,
    title: "Invoice Management",
    description: "Create, send, and track professional invoices with automatic reminders.",
    href: "/services#invoices",
  },
  {
    icon: Brain,
    title: "AI Categorization",
    description: "Smart algorithms automatically categorize and tag your transactions.",
    href: "/services#ai",
  },
]

export function Features() {
  return (
    <section id="features" className="bg-secondary/50 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Features
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to manage your finances
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful tools designed to simplify your financial life
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Learn more
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
