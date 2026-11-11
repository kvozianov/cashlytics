// Planned pricing. Cashlytics is not on sale; these numbers describe how the
// product was meant to be packaged and are shown as such everywhere they appear.

export type PlanFeature = {
  name: string
  /** `demo` = can be tried in the live demo today; `planned` = not built yet. */
  status: "demo" | "planned"
}

export type Plan = {
  id: "basic" | "pro" | "business"
  name: string
  price: number
  audience: string
  highlight?: string
  features: PlanFeature[]
}

export const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 9,
    audience: "For a first salary and a simple budget",
    features: [
      { name: "Income and expense tracking", status: "demo" },
      { name: "Automatic categories and your own rules", status: "demo" },
      { name: "Dashboard, budgets and goals", status: "demo" },
      { name: "Micro-lessons", status: "demo" },
      { name: "Invoicing, up to 5 a month", status: "demo" },
      { name: "Bank sync for 2 accounts", status: "planned" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    audience: "For freelancers with irregular income",
    highlight: "Designed for freelancers",
    features: [
      { name: "Everything in Basic", status: "demo" },
      { name: "Tax estimate, schedule and set-aside", status: "demo" },
      { name: "Unlimited invoices", status: "demo" },
      { name: "Health score and weak points", status: "demo" },
      { name: "Cash-flow forecast", status: "demo" },
      { name: "Unlimited bank sync", status: "planned" },
      { name: "Receipt scanning", status: "planned" },
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 79,
    audience: "For small businesses and teams",
    features: [
      { name: "Everything in Pro", status: "demo" },
      { name: "Business and personal categories", status: "demo" },
      { name: "Team access, up to 10 people", status: "planned" },
      { name: "Custom reports and scheduled exports", status: "planned" },
      { name: "Online invoice payments", status: "planned" },
      { name: "API access", status: "planned" },
    ],
  },
]
