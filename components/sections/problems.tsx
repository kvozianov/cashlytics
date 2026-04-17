import { AlertCircle, Calculator, BookOpen, FileStack } from "lucide-react"

const problems = [
  {
    icon: AlertCircle,
    title: "Poor Financial Organization",
    description: "Scattered spreadsheets, lost receipts, and no clear view of your financial health.",
  },
  {
    icon: Calculator,
    title: "Manual Tax Calculations",
    description: "Hours spent on complex calculations that are prone to costly errors.",
  },
  {
    icon: BookOpen,
    title: "Lack of Financial Knowledge",
    description: "Missing opportunities to optimize savings and reduce tax burden.",
  },
  {
    icon: FileStack,
    title: "Too Much Paperwork",
    description: "Drowning in invoices, statements, and compliance documents.",
  },
]

export function Problems() {
  return (
    <section className="bg-secondary/50 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Sound familiar?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            These challenges are costing you time, money, and peace of mind
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
          {problems.map((problem, index) => (
            <div
              key={problem.title}
              className="group relative overflow-hidden rounded-xl border border-destructive/20 bg-card p-6 transition-all hover:border-destructive/40 hover:shadow-lg"
            >
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 text-8xl font-bold text-destructive/5">
                {index + 1}
              </div>
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <problem.icon className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{problem.title}</h3>
                <p className="mt-2 text-muted-foreground">{problem.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
