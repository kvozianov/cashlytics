import type { CSSProperties } from "react"
import { ChapterText, Numeral, type ChapterCopy } from "./chapter"
import { LessonCard, type Lesson } from "./lesson-card"

const copy: ChapterCopy = {
  index: 3,
  name: "Learn",
  titleLines: ["Short lessons that use", "your own numbers."],
  body: "Two-minute lessons on emergency funds, tax set-asides, subscriptions and cash flow. Each one ends with a sentence about your situation, not a generic tip, and links to the screen where you can act on it.",
  example: "The emergency-fund lesson tells you how many months of spending your savings cover today, and what three months would take.",
  href: "/demo/learn",
  cta: "Open lessons",
}

// Backs use Maya's fictional numbers, the same ones shown elsewhere on this page.
const lessons: Lesson[] = [
  {
    n: 1,
    title: "Emergency fund",
    front: "How many months of spending your savings should cover, and how to get there.",
    back: "Your savings cover 1.4 months of spending. Three months would take another $6,920.",
  },
  {
    n: 2,
    title: "Tax set-aside",
    front: "Why a slice of every payment goes away, and how big the slice should be.",
    back: "You have set aside $2,180 of an estimated $2,620 this quarter. $440 to go.",
  },
  {
    n: 3,
    title: "Subscription creep",
    front: "Small recurring charges add up. How to find the ones you no longer use.",
    back: "You pay for the same streaming service twice: $185.88 a year.",
  },
  {
    n: 4,
    title: "Irregular income",
    front: "Budgeting when every month pays differently: plan on the lean months.",
    back: "Your leanest month this year brought in $4,800. Budget fixed costs against that, not the average.",
  },
]

// Fan geometry for large screens: x offset, y offset, rotation.
const fan = [
  ["-232px", "26px", "-9deg"],
  ["-78px", "0px", "-3deg"],
  ["78px", "8px", "3deg"],
  ["232px", "34px", "9deg"],
]

export function ChapterLearn() {
  return (
    <section id="learn" aria-labelledby="learn-title" className="overflow-x-clip border-t border-border py-20 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12">
        <div className="lg:col-span-5">
          <Numeral n={copy.index} className="-mb-[0.06em] -ml-[0.04em]" />
          <ChapterText copy={copy} titleId="learn-title" />
        </div>

        <div className="lg:col-span-7 lg:flex lg:flex-col lg:items-center lg:justify-center">
          <p className="mb-4 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase lg:hidden">
            Tap a card to turn it over
          </p>
          <ul
            data-animate=""
            aria-label="Example lessons"
            className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 sm:-mx-8 sm:px-8 lg:relative lg:mx-0 lg:block lg:h-[30rem] lg:w-full lg:overflow-visible lg:p-0"
          >
            {lessons.map((lesson, i) => (
              <li
                key={lesson.n}
                className="fan-card shrink-0 snap-center lg:absolute lg:top-6 lg:left-1/2 lg:-ml-[7.75rem]"
                style={{ "--fx": fan[i][0], "--fy": fan[i][1], "--fr": fan[i][2], "--i": i, zIndex: i } as CSSProperties}
              >
                <LessonCard lesson={lesson} />
              </li>
            ))}
          </ul>
          <p className="hidden font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase lg:mt-10 lg:block">
            Hover or press a card to turn it over
          </p>
        </div>
      </div>
    </section>
  )
}
