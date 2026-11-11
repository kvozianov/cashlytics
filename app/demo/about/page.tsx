'use client'

import Link from 'next/link'
import { Check, HardDrive, RotateCcw, X } from 'lucide-react'

import { PageHeader, SectionCard } from '@/components/demo/ui'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { KEYWORD_PATTERN_COUNT, MERCHANT_DICTIONARY_SIZE } from '@/lib/demo/categorize'
import { MONTHS_OF_HISTORY } from '@/lib/demo/generate'
import { LESSONS } from '@/lib/demo/lessons'
import { PERSONA_IDS, PERSONAS } from '@/lib/demo/personas'
import { ACTIVE_PERSONA_KEY, storageKey } from '@/lib/demo/storage'
import { useDemo } from '@/lib/demo/store'

function Row({ yes, title, children }: { yes: boolean; title: string; children: React.ReactNode }) {
  const Icon = yes ? Check : X
  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <Icon aria-hidden="true" className={yes ? 'mt-0.5 size-4 shrink-0 text-success' : 'mt-0.5 size-4 shrink-0 text-muted-foreground'} />
      <div className="space-y-1">
        <p className="text-sm font-medium">
          <span className="sr-only">{yes ? 'Real: ' : 'Simulated: '}</span>
          {title}
        </p>
        <p className="text-sm text-pretty text-muted-foreground">{children}</p>
      </div>
    </li>
  )
}

export default function AboutDemoPage() {
  const { state, persona, actions } = useDemo()
  const transactionCount = `${state.transactions.length.toLocaleString('en-US')} transactions`

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="About the demo"
        title="How this demo works"
        description="Everything you click here runs in your browser on made-up data. Some parts are real working code; some parts of a finished product are simulated. Here is exactly which is which."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Real, working code" description="The logic a finished product would need, written and tested.">
          <ul className="divide-y divide-border">
            <Row yes title="Data generator">
              Builds {MONTHS_OF_HISTORY} months of bank-style transactions for each persona from a seeded random generator, so the same day always gives the same
              data. {persona.name} currently has {transactionCount}. Balances, invoices and tax payments all add up.
            </Row>
            <Row yes title="Rule-based categoriser">
              Every transaction is sorted by rules, in order: your own rules, a dictionary of {MERCHANT_DICTIONARY_SIZE} known merchants, then{' '}
              {KEYWORD_PATTERN_COUNT} keyword patterns. Low-confidence matches go to a review queue, and each category shows why it was chosen.
            </Row>
            <Row yes title="Tax estimate">
              Adds up taxable income and deductible costs, applies a flat rate or progressive brackets, splits the year into quarterly payments and compares them
              with what you have paid and set aside. The maths is illustrative and does not follow any country&apos;s law.
            </Row>
            <Row yes title="Insights engine">
              Scores financial health from six measurable parts and looks for weak points: tax not covered, late payers, a thin cash buffer, subscriptions piling
              up, costs rising faster than income. Every rule and threshold is plain code; there is no AI model behind it.
            </Row>
            <Row yes title="Connected modules">
              Marking an invoice paid creates the income transaction, which changes the dashboard, the tax estimate and the health score at the same time.
            </Row>
            <Row yes title="Automated tests">
              A test suite checks that the generator is repeatable, that balances reconcile, that the categoriser, tax maths, CSV import and quick-add parser behave,
              and that each persona&apos;s weak points are found.
            </Row>
          </ul>
        </SectionCard>

        <SectionCard title="Simulated" description="What a real product would add, which this demo does not have.">
          <ul className="divide-y divide-border">
            <Row yes={false} title="No bank connection">
              The transactions are generated, not downloaded from a bank. You can import your own CSV file to try the parser; it stays in this browser.
            </Row>
            <Row yes={false} title="No accounts, no sign-in">
              There is nothing to sign up for. The three people and the coffee kiosk are fictional.
            </Row>
            <Row yes={false} title="No server">
              The demo makes no network requests with your data. Invoices are not emailed and payments are not real.
            </Row>
            <Row yes={false} title="Not tax or financial advice">
              Rates, due dates and rules are simplified examples. Real tax depends on where you live and your situation.
            </Row>
            <Row yes={false} title="AI is a plan, not a feature">
              Smarter categorisation and a money assistant are on the roadmap. Everything you see today is rule-based.
            </Row>
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <SectionCard title="Where your data lives">
          <div className="space-y-3 text-sm text-pretty text-muted-foreground">
            <p className="flex gap-2">
              <HardDrive aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                Changes are saved in this browser&apos;s local storage, one entry per persona, so each keeps its own edits. Nothing is uploaded and nothing is
                shared between devices.
              </span>
            </p>
            <ul className="space-y-1 rounded-md border border-border bg-muted/50 p-3 font-mono text-xs text-foreground">
              {PERSONA_IDS.map((id) => (
                <li key={id}>{storageKey(id)}</li>
              ))}
              <li>{ACTIVE_PERSONA_KEY}</li>
            </ul>
            <p>
              Untouched data is regenerated each day so it always ends today. Once you change something, your version is kept until you reset it. Clearing this
              site&apos;s data in your browser removes everything.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Start again">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="font-medium text-foreground">Reset demo</strong> (also in the strip at the top) throws away your changes for {persona.name} and
              brings back the original data. Other personas keep theirs.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <RotateCcw aria-hidden="true" className="size-3.5" />
                  Reset {persona.name}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset the demo for {persona.name}?</AlertDialogTitle>
                  <AlertDialogDescription>Your changes to this persona are removed and the original fictional data comes back.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => actions.reset()}>Reset demo</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="The three personas" description="Each data set is built around one weak spot, which the insights engine has to find on its own.">
        <ul className="grid gap-4 md:grid-cols-3">
          {PERSONA_IDS.map((id) => {
            const p = PERSONAS[id]
            const current = id === persona.id
            return (
              <li key={id} className="flex flex-col gap-3 rounded-md border border-border p-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                </div>
                <p className="text-sm text-pretty text-muted-foreground">{p.story}</p>
                <div className="mt-auto">
                  {current ? (
                    <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Viewing now</span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => actions.switchPersona(id)}>
                      Switch to {p.name}
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Background">
        <div className="max-w-3xl space-y-3 text-sm text-pretty text-muted-foreground">
          <p>
            Cashlytics is a concept prototype. It started as a business idea by a two-person school team for the TeenMBA final 2026 at De Montfort University
            Kazakhstan, where it took first place. The idea: one tool to manage money, plan for tax and goals, and learn the basics along the way, built for people
            with a first income, freelancers and small businesses.
          </p>
          <p>
            This demo is not a financial product and has no users. It exists to show how the idea would work, with {LESSONS.length} short lessons in the{' '}
            <Link href="/demo/learn" className="text-foreground underline underline-offset-4">
              Learn
            </Link>{' '}
            section to explain the ideas behind it.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
