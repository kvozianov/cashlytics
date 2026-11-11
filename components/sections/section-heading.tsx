import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: "center" | "left"
  as?: "h1" | "h2"
  id?: string
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as: Heading = "h2",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
      )}
      <Heading
        id={id}
        className={cn(
          "mt-3 font-display font-bold tracking-[-0.035em] text-foreground text-balance",
          Heading === "h1" ? "text-5xl leading-[0.95] sm:text-6xl" : "text-4xl leading-[0.98] sm:text-5xl",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">{description}</p>
      )}
    </div>
  )
}
