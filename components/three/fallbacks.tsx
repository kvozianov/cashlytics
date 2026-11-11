import { cn } from "@/lib/utils"

// Static stand-ins for the 3D scenes: shown while the canvas loads, when WebGL
// is missing, and wherever the page prefers no motion. Same objects, flat.
// Colours live in a small style block so they follow the `.dark` class without
// depending on generated utility classes.

type FallbackProps = { className?: string }
type Tone = "lime" | "ink" | "green"

const THEME_CSS = `
.c3-ink{fill:#1B1A16}.dark .c3-ink{fill:#D9D3C4}
.c3-ink-side{fill:#000}.dark .c3-ink-side{fill:#A9A292}
.c3-shadow{fill:#3A3326;fill-opacity:.14}.dark .c3-shadow{fill:#000;fill-opacity:.45}
.c3-glass{fill:#DCEBE4;fill-opacity:.25;stroke:#4A5A52;stroke-opacity:.55}
.dark .c3-glass{fill:#F4F1EA;fill-opacity:.07;stroke:#F4F1EA;stroke-opacity:.7}
.c3-note{fill:#14130F}.dark .c3-note{fill:#EFEBE1}
`

function ThemeStyle() {
  return <style>{THEME_CSS}</style>
}

const FACE: Record<Tone, string> = { lime: "#D6F84C", green: "#0E7C4A", ink: "" }
const SIDE: Record<Tone, string> = { lime: "#A9C73A", green: "#0A5C37", ink: "" }

function Coin({ x, y, r, tone }: { x: number; y: number; r: number; tone: Tone }) {
  const ry = r * 0.42
  const t = r * 0.28
  const side = tone === "ink" ? { className: "c3-ink-side" } : { fill: SIDE[tone] }
  const face = tone === "ink" ? { className: "c3-ink" } : { fill: FACE[tone] }
  const mark = tone === "lime" ? "#14130F" : tone === "ink" ? "#7A7466" : "#FBF9F4"
  return (
    <g>
      <ellipse cx={x} cy={y + t} rx={r} ry={ry} {...side} />
      <rect x={x - r} y={y} width={r * 2} height={t} {...side} />
      <ellipse cx={x} cy={y} rx={r} ry={ry} {...face} />
      <ellipse cx={x} cy={y} rx={r * 0.82} ry={ry * 0.82} fill="none" stroke={mark} strokeOpacity={0.2} strokeWidth={2} />
      <g transform={`translate(${x} ${y}) scale(1 0.42)`} fill={mark} fillOpacity={0.28}>
        <path d={`M${-r * 0.36} ${r * 0.34} V${-r * 0.02} L${-r * 0.2} ${-r * 0.1} V${r * 0.34} Z`} />
        <path d={`M${-r * 0.08} ${r * 0.34} V${-r * 0.14} L${r * 0.08} ${-r * 0.22} V${r * 0.34} Z`} />
        <path d={`M${r * 0.2} ${r * 0.34} V${-r * 0.26} L${r * 0.36} ${-r * 0.34} V${r * 0.34} Z`} />
      </g>
    </g>
  )
}

function zigzag(x0: number, x1: number, y: number, tooth: number, dir: 1 | -1, reverse: boolean) {
  const pts: string[] = []
  if (!reverse) {
    for (let x = x0; x < x1; x += tooth) pts.push(`L${x + tooth / 2} ${y + (dir * tooth) / 2}`, `L${Math.min(x1, x + tooth)} ${y}`)
  } else {
    for (let x = x1; x > x0; x -= tooth) pts.push(`L${x - tooth / 2} ${y + (dir * tooth) / 2}`, `L${Math.max(x0, x - tooth)} ${y}`)
  }
  return pts.join(" ")
}

export function HeroFallback({ className }: FallbackProps) {
  const x0 = 250
  const x1 = 430
  const top = 40
  const bottom = 520
  const rows = [0, 1, 2, 3, 4, 5, 6]
  const receipt = `M${x0} ${top} ${zigzag(x0, x1, top, 12, -1, false)} L${x1} ${bottom} ${zigzag(x0, x1, bottom, 12, 1, true)} Z`
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 select-none", className)}>
      <svg viewBox="0 0 600 600" preserveAspectRatio="xMaxYMid meet" className="h-full w-full">
        <ThemeStyle />
        <ellipse cx="350" cy="560" rx="210" ry="18" className="c3-shadow" />
        <g transform="rotate(7 340 280)">
          <path d={receipt} fill="#FBF9F4" stroke="#14130F" strokeOpacity={0.15} strokeWidth={1.5} />
          <rect x={x0 + 52} y={top + 30} width={76} height={8} rx={2} fill="#14130F" />
          <rect x={x0 + 20} y={top + 56} width={140} height={1.5} fill="#14130F" fillOpacity={0.4} />
          <rect x={x0 + 14} y={top + 104} width={152} height={18} rx={3} fill="#D6F84C" transform={`rotate(-1.5 ${x0 + 90} ${top + 113})`} />
          {rows.map((i) => (
            <g key={i} fill="#14130F" fillOpacity={0.7}>
              <rect x={x0 + 20} y={top + 78 + i * 30} width={70 + ((i * 37) % 30)} height={6} rx={1.5} />
              <rect x={x0 + 132} y={top + 78 + i * 30} width={28} height={6} rx={1.5} />
            </g>
          ))}
          <rect x={x0 + 20} y={top + 300} width={140} height={1.5} fill="#14130F" fillOpacity={0.4} />
          <rect x={x0 + 20} y={top + 322} width={54} height={8} rx={2} fill="#14130F" />
          <rect x={x0 + 118} y={top + 322} width={42} height={8} rx={2} fill="#14130F" />
          <ellipse cx={x0 + 139} cy={top + 326} rx={34} ry={17} fill="none" stroke="#F0502D" strokeWidth={3} transform={`rotate(-6 ${x0 + 139} ${top + 326})`} />
        </g>
        <g className="c3-ink">
          <path d="M120 540 V470 L162 452 V540 Z" />
          <path d="M172 540 V440 L214 422 V540 Z" />
          <path d="M224 540 V410 L266 392 V540 Z" />
        </g>
        <Coin x={248} y={378} r={30} tone="lime" />
        <Coin x={470} y={530} r={44} tone="green" />
        <Coin x={474} y={512} r={44} tone="ink" />
        <Coin x={468} y={494} r={44} tone="lime" />
        <Coin x={530} y={230} r={34} tone="green" />
        <Coin x={70} y={548} r={26} tone="lime" />
      </svg>
    </div>
  )
}

const JAR_COINS: [number, number, Tone][] = [
  [160, 488, "lime"], [214, 494, "green"], [268, 488, "ink"], [322, 492, "lime"], [370, 484, "green"],
  [186, 458, "ink"], [240, 462, "lime"], [296, 456, "green"], [350, 460, "ink"],
  [212, 428, "green"], [268, 432, "lime"], [324, 426, "ink"], [244, 398, "lime"], [300, 402, "green"],
]

export function JarFallback({ className }: FallbackProps) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 select-none", className)}>
      <svg viewBox="0 0 560 600" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        <ThemeStyle />
        <ellipse cx="300" cy="548" rx="230" ry="20" className="c3-shadow" />
        {JAR_COINS.map(([x, y, tone], i) => (
          <Coin key={i} x={x} y={y} r={30} tone={tone} />
        ))}
        <path
          d="M150 150 Q150 128 170 124 L370 124 Q390 128 390 150 L390 160 Q430 182 430 230 L430 500 Q430 542 390 542 L150 542 Q110 542 110 500 L110 230 Q110 182 150 160 Z"
          className="c3-glass"
          strokeWidth={3}
        />
        <path d="M128 240 L128 480" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={6} strokeLinecap="round" />
        <path d="M300 300 Q330 296 360 302" stroke="#D6F84C" strokeWidth={9} strokeLinecap="round" fill="none" />
        <text x="368" y="306" className="c3-note" fontSize="20" fontStyle="italic">
          needed
        </text>
        <rect x="150" y="340" width="240" height="118" rx="4" fill="#FBF9F4" stroke="#14130F" strokeOpacity={0.85} strokeWidth={2} />
        <text x="270" y="408" textAnchor="middle" fill="#14130F" fontFamily="ui-monospace, Menlo, monospace" fontSize="25" fontWeight={500} letterSpacing="2">
          TAX RESERVE
        </text>
        <rect x="175" y="424" width="190" height="1.5" fill="#14130F" fillOpacity={0.3} />
        <g transform="translate(470 520)">
          <ellipse cx="0" cy="14" rx="62" ry="20" fill="#A8845F" />
          <rect x="-62" y="-14" width="124" height="28" fill="#A8845F" />
          <ellipse cx="0" cy="-14" rx="62" ry="20" fill="#C9A27A" />
        </g>
      </svg>
    </div>
  )
}

export function CoinFallback({ className }: FallbackProps) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 select-none", className)}>
      <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        <ThemeStyle />
        <ellipse cx="200" cy="372" rx="110" ry="12" className="c3-shadow" />
        <circle cx="212" cy="196" r="150" fill="#A9C73A" />
        <circle cx="200" cy="190" r="150" fill="#D6F84C" />
        <circle cx="200" cy="190" r="124" fill="none" stroke="#14130F" strokeOpacity={0.22} strokeWidth={6} />
        <g fill="#14130F" fillOpacity={0.78}>
          <path d="M140 250 V190 L172 176 V250 Z" />
          <path d="M184 250 V160 L216 146 V250 Z" />
          <path d="M228 250 V130 L260 116 V250 Z" />
        </g>
      </svg>
    </div>
  )
}
