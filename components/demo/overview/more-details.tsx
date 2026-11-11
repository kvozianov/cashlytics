'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

import { Accounts } from './accounts'
import { Recent } from './recent'
import { Spending } from './spending'
import { Upcoming } from './upcoming'

/** Everything secondary, closed until asked for. */
export function MoreDetails() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="details" className="border-y border-border">
        <AccordionTrigger className="py-5 text-base hover:no-underline">
          <span>
            More details
            <span className="ml-2 font-normal text-muted-foreground">categories, what is coming up, accounts, latest transactions</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-10">
          <div className="grid gap-x-16 gap-y-12 pt-4 lg:grid-cols-2">
            <Spending />
            <Upcoming />
            <Recent />
            <Accounts />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
