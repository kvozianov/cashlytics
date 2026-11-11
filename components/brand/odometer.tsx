import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { animAttrs, type AnimProps } from "./anim"

type OdometerProps = AnimProps & {
  value: number
  format?: "number" | "usd"
  decimals?: number
  /**
   * false: the first render shows the real value and the digits roll only when
   * `value` changes later, quickly. For figures the visitor reads straight away (the demo).
   */
  rollOnMount?: boolean
  className?: string
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

function formatValue(value: number, format: "number" | "usd", decimals: number) {
  return new Intl.NumberFormat("en-US", {
    style: format === "usd" ? "currency" : "decimal",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Digits that roll into place. By default rolls up from zero when it first
 * comes into view, and rolls again whenever `value` changes.
 */
export function Odometer({ value, format = "number", decimals = 0, rollOnMount = true, className, ...anim }: OdometerProps) {
  const text = formatValue(value, format, decimals)
  const chars = text.split("")
  let digitIndex = 0
  return (
    <span
      {...animAttrs(rollOnMount ? anim : { ...anim, still: true })}
      className={cn("inline-flex font-mono tabular-nums", !rollOnMount && "odo-quick", className)}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((char, i) => {
          // Keyed from the right so existing digits keep rolling when the number grows.
          const key = chars.length - i
          if (!/\d/.test(char)) {
            return (
              <span key={key} className="inline-block h-[1.1em] leading-[1.1em]">
                {char}
              </span>
            )
          }
          const order = digitIndex++
          return (
            <span key={key} className="odo-col">
              <span className="odo-strip" style={{ "--n": Number(char), "--i": order } as CSSProperties}>
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
