import { Check } from "lucide-react"

const reasons = [
  {
    title: "All-in-One Platform",
    description: "No more juggling multiple tools. Everything you need in one place.",
    points: ["Unified dashboard", "Seamless integrations", "Single source of truth"],
  },
  {
    title: "Automation-First",
    description: "Reduce manual work and focus on what matters most to your business.",
    points: ["Auto-categorization", "Scheduled reports", "Smart reminders"],
  },
  {
    title: "Built for Everyone",
    description: "Whether you are a freelancer or a small business, we have got you covered.",
    points: ["Flexible plans", "Scalable features", "Personal to business"],
  },
  {
    title: "Saves Time & Reduces Errors",
    description: "Spend less time on finances and more time growing your business.",
    points: ["90% less manual entry", "Accurate calculations", "Audit-ready reports"],
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Why Cashlytics
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The smarter way to manage your finances
          </h2>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-2">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="rounded-xl border border-border bg-card p-8 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-foreground">{reason.title}</h3>
              <p className="mt-2 text-muted-foreground">{reason.description}</p>
              <ul className="mt-6 space-y-3">
                {reason.points.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20">
                      <Check className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm text-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
