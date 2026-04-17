import { Repeat, Clock, LineChart, Sparkles } from "lucide-react"

const solutions = [
  {
    icon: Repeat,
    title: "Automated Tracking",
    description: "Income and expenses automatically categorized and organized in real-time.",
    color: "primary",
  },
  {
    icon: Clock,
    title: "Real-time Tax Calculation",
    description: "Always know your estimated tax liability with up-to-date calculations.",
    color: "accent",
  },
  {
    icon: LineChart,
    title: "Financial Analytics Dashboard",
    description: "Beautiful visualizations that make complex data easy to understand.",
    color: "primary",
  },
  {
    icon: Sparkles,
    title: "AI-based Categorization",
    description: "Smart algorithms learn your patterns and categorize transactions automatically.",
    color: "accent",
  },
]

export function Solutions() {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Our Solutions
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            We solve these problems for you
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful automation meets intuitive design
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2">
          {solutions.map((solution) => (
            <div
              key={solution.title}
              className="group relative rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-lg"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                solution.color === "accent" ? "bg-accent/10" : "bg-primary/10"
              }`}>
                <solution.icon className={`h-7 w-7 ${
                  solution.color === "accent" ? "text-accent" : "text-primary"
                }`} />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{solution.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{solution.description}</p>
              <div className={`mt-6 h-1 w-16 rounded-full ${
                solution.color === "accent" ? "bg-accent/50" : "bg-primary/50"
              }`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
