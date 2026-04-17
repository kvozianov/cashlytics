import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
            </span>
            Now with AI-powered insights
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Smart Financial Management for{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Individuals & Businesses
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            Track income, calculate taxes, and optimize your financial strategy in one place. 
            The all-in-one platform that automates your finances and saves you time.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90" asChild>
              <Link href="/pricing">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/services">
                <Play className="mr-2 h-4 w-4" />
                View Services
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>14-day free trial</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 lg:mt-24">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-4 flex-1 rounded bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  app.cashlytics.com/dashboard
                </div>
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <DashboardCard title="Total Income" value="$48,352" change="+12.5%" positive />
                  <DashboardCard title="Tax Estimate" value="$8,642" change="Q2 2024" />
                  <DashboardCard title="Savings Rate" value="32%" change="+5%" positive />
                </div>
                <div className="mt-6 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Monthly Revenue</span>
                    <span className="text-xs text-muted-foreground">Last 6 months</span>
                  </div>
                  <div className="flex h-32 items-end gap-2">
                    {[40, 55, 45, 70, 65, 85].map((height, i) => (
                      <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary to-accent" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardCard({ 
  title, 
  value, 
  change, 
  positive 
}: { 
  title: string
  value: string
  change: string
  positive?: boolean 
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className={`mt-1 text-xs ${positive ? "text-accent" : "text-muted-foreground"}`}>
        {change}
      </p>
    </div>
  )
}
