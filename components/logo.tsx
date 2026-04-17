import Link from "next/link"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex h-9 w-9 items-center justify-center">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 w-9"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="10" fill="url(#logoGradient)" />
          <path
            d="M12 28V18L16 14V28H12Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M18 28V16L22 12V28H18Z"
            fill="white"
          />
          <path
            d="M24 28V14L28 10V28H24Z"
            fill="white"
            opacity="0.9"
          />
          <circle cx="27" cy="14" r="3" fill="white" />
        </svg>
      </div>
      <span className="text-xl font-bold text-foreground">Cashlytics</span>
    </Link>
  )
}
