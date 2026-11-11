import { Ticker, type TickerItem } from "@/components/brand"

// Fictional bank descriptions, filed the way the demo's rules would file them.
const items: TickerItem[] = [
  { from: "SQ *BLUE BOTTLE 0423", amount: "−5.40", to: "Eating out" },
  { from: "ADOBE *CREATIVE CLOUD", amount: "−59.99", to: "Software" },
  { from: "NORTHWIND STUDIO INV-014", amount: "+2,400.00", to: "Client income" },
  { from: "WHOLEFDS MKT #10234", amount: "−86.31", to: "Groceries" },
  { from: "UBER *TRIP 8HJ2K", amount: "−18.20", to: "Transport" },
  { from: "NETFLIX.COM 866-579", amount: "−15.49", to: "Subscriptions" },
  { from: "AMZN MKTP US*2K4L1", amount: "−84.12", to: "Needs review" },
  { from: "CITY PWR & LIGHT 0911", amount: "−64.70", to: "Utilities" },
  { from: "SPOTIFY P1A2B3C4", amount: "−11.99", to: "Subscriptions" },
  { from: "LANDLORD RENT NOV", amount: "−1,150.00", to: "Rent" },
]

/** The tape that crosses the bottom of the hero. */
export function TickerBand() {
  return (
    <div className="relative z-20 -my-2 overflow-x-clip py-6">
      <div className="-mx-4 -rotate-[1.6deg]">
        <Ticker items={items} duration={70} />
      </div>
    </div>
  )
}
