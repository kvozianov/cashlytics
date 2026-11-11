import type { CSSProperties, ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"

type RevealLinesProps = {
  /** One entry per line. Each line rises from its own mask. */
  lines: ReactNode[]
  as?: ElementType
  id?: string
  className?: string
  lineClassName?: string
  /** ms before the first line moves */
  delay?: number
  /** ms between lines */
  stagger?: number
}

/**
 * Headline whose lines rise out of a mask one after another when it scrolls
 * into view. Pure CSS: readable without JavaScript and with reduced motion.
 */
export function RevealLines({
  lines,
  as: Tag = "h2",
  id,
  className,
  lineClassName,
  delay = 0,
  stagger = 110,
}: RevealLinesProps) {
  return (
    <Tag
      id={id}
      data-animate=""
      className={className}
      style={{ "--d": `${delay}ms`, "--stagger": `${stagger}ms` } as CSSProperties}
    >
      {lines.map((line, i) => (
        <span key={i} className={cn("rl-line", lineClassName)}>
          <span className="rl-inner" style={{ "--i": i } as CSSProperties}>
            {line}
          </span>
          {i < lines.length - 1 && " "}
        </span>
      ))}
    </Tag>
  )
}
