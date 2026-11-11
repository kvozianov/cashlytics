import type { CSSProperties, ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { animAttrs, type AnimProps } from "./anim"

type ReceiptProps = AnimProps & {
  children: ReactNode
  /** which edges are perforated */
  edge?: "both" | "top" | "bottom" | "none"
  /** how long the print takes, ms */
  printMs?: number
  as?: ElementType
  className?: string
  id?: string
}

/** A strip of receipt paper with perforated edges that prints downward into view. */
export function Receipt({ children, edge = "both", printMs = 1200, as: Tag = "div", className, id, ...anim }: ReceiptProps) {
  return (
    <Tag
      id={id}
      {...animAttrs(anim, { "--print": `${printMs}ms` } as CSSProperties)}
      data-edge={edge}
      className={cn("paper", !anim.still && "print", "px-5 py-7 font-mono text-[13px] leading-relaxed text-card-foreground sm:px-6", className)}
    >
      {children}
    </Tag>
  )
}

/** A dashed rule across a receipt. */
export function ReceiptRule({ className }: { className?: string }) {
  return <hr className={cn("my-3 border-0 border-t border-dashed border-current opacity-35", className)} />
}
