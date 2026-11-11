import Link from "next/link"
import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  /** Where the logo links to. Pass `null` to render it without a link. */
  href?: string | null
  /** Show only the mark (the name stays available to screen readers). */
  markOnly?: boolean
  markClassName?: string
}

/**
 * Three rising ink bars and a lime coin landing on the tallest one. Drawn on a
 * 2-unit grid so it stays crisp at 16 px. Bars follow the text colour.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn("h-8 w-8 shrink-0 text-foreground", className)}
    >
      <path d="M2 30V21.5L8 19V30Z" fill="currentColor" />
      <path d="M12 30V15.5L18 13V30Z" fill="currentColor" />
      <path d="M22 30V11.5L28 9V30Z" fill="currentColor" />
      <circle cx="25.5" cy="7" r="4.75" fill="#D6F84C" stroke="#14130F" strokeWidth="2" />
    </svg>
  )
}

export function Logo({ className, href = "/", markOnly = false, markClassName }: LogoProps) {
  const content = (
    <>
      <LogoMark className={markClassName} />
      {markOnly ? (
        <span className="sr-only">Cashlytics</span>
      ) : (
        <span className="font-display text-[1.375rem] leading-none font-bold tracking-[-0.035em] text-foreground">
          Cashlytics
        </span>
      )}
    </>
  )

  if (href === null) {
    return <span className={cn("flex items-center gap-2", className)}>{content}</span>
  }

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4", className)}
    >
      {content}
    </Link>
  )
}
