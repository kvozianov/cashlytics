'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, type ComponentProps, type MouseEvent } from 'react'

interface NavigateOptions {
  /** Scroll to the top after a same-page change. Default true. */
  scroll?: boolean
}

function pathOf(href: string) {
  return new URL(href, window.location.href).pathname
}

/**
 * Navigate inside the demo. A change that only touches the query on the current page goes
 * straight to history (Next keeps useSearchParams in sync with it); other pages use the router.
 */
export function useDemoNavigate() {
  const router = useRouter()
  return useCallback(
    (href: string, { scroll = true }: NavigateOptions = {}) => {
      if (pathOf(href) !== window.location.pathname) {
        router.push(href, { scroll })
        return
      }
      const current = window.location.pathname + window.location.search + window.location.hash
      if (href === current) window.history.replaceState(null, '', href)
      else window.history.pushState(null, '', href)
      if (scroll) window.scrollTo({ top: 0 })
    },
    [router],
  )
}

type QueryLinkProps = Omit<ComponentProps<'a'>, 'href'> & { href: string; scroll?: boolean }

/**
 * A link that may point at the page it is on with a different query. Same page: a plain
 * anchor whose plain left click goes through useDemoNavigate. Other pages: next/link.
 */
export function QueryLink({ href, scroll, onClick, children, ...rest }: QueryLinkProps) {
  const pathname = usePathname()
  const navigate = useDemoNavigate()
  const samePage = href.split(/[?#]/)[0] === pathname

  if (!samePage) {
    return (
      <Link href={href} scroll={scroll} onClick={onClick} {...rest}>
        {children}
      </Link>
    )
  }

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (rest.target && rest.target !== '_self') return
    e.preventDefault()
    navigate(href, { scroll })
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
