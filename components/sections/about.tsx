import { Zap, Shield, BarChart3, Brain } from "lucide-react"

const highlights = [
  {
    icon: Zap,
    title: "Financial Automation",
    description: "Automate repetitive financial tasks and save hours every week.",
  },
  {
    icon: Shield,
    title: "Consulting Platform",
    description: "Expert guidance to optimize your financial strategy.",
  },
  {
    icon: BarChart3,
    title: "Income Tracking",
    description: "Real-time visibility into all your income streams.",
  },
  {
    icon: Brain,
    title: "AI Insights",
    description: "Smart recommendations powered by machine learning.",
  },
]

export function About() {
  return (
    <section id="about" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              The all-in-one financial platform built for{" "}
              <span className="text-primary">modern businesses</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Cashlytics combines powerful automation with expert consulting to help 
              individuals and businesses take control of their finances. From income 
              tracking to tax automation, we provide the tools you need to succeed.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 blur-xl" />
            <div className="relative grid gap-4">
              <div className="flex gap-4">
                <StatCard value="50K+" label="Active Users" />
                <StatCard value="$2B+" label="Tracked Annually" />
              </div>
              <div className="flex gap-4">
                <StatCard value="99.9%" label="Uptime" />
                <StatCard value="4.9/5" label="User Rating" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
