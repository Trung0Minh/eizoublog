"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Loader } from "@/components/ui/Loader"

function isModifiedClick(event: MouseEvent) {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
}

function shouldTrackNavigation(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return false
  if (anchor.hasAttribute("download")) return false

  const url = new URL(anchor.href)

  if (url.origin !== window.location.origin) return false

  const currentUrl = new URL(window.location.href)
  const samePage =
    url.pathname === currentUrl.pathname && url.search === currentUrl.search

  return !(samePage && url.hash)
}

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const routeKey = `${pathname}?${searchKey}`
  const previousRouteKeyRef = useRef(routeKey)
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (previousRouteKeyRef.current === routeKey) {
      return
    }

    previousRouteKeyRef.current = routeKey
    const timeoutId = window.setTimeout(() => setIsNavigating(false), 0)

    return () => window.clearTimeout(timeoutId)
  }, [routeKey])

  useEffect(() => {
    if (!isNavigating) return

    const timeoutId = window.setTimeout(() => setIsNavigating(false), 8000)

    return () => window.clearTimeout(timeoutId)
  }, [isNavigating])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        isModifiedClick(event)
      ) {
        return
      }

      const target = event.target instanceof Element ? event.target : null
      const anchor = target?.closest<HTMLAnchorElement>("a[href]")

      if (!anchor || !shouldTrackNavigation(anchor)) {
        return
      }

      setIsNavigating(true)
    }

    document.addEventListener("click", handleClick, { capture: true })

    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
    }
  }, [])

  if (!isNavigating) {
    return null
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed left-0 right-0 top-0 z-[220] h-0.5 overflow-hidden bg-transparent"
      >
        <div className="h-full w-full origin-left animate-navigation-progress bg-accent" />
      </div>
      <div
        aria-live="polite"
        className="fixed left-1/2 top-3 z-[221] -translate-x-1/2 rounded-full border border-border-default bg-background/90 p-2 shadow-sm backdrop-blur"
        role="status"
      >
        <span className="sr-only">Đang tải trang</span>
        <Loader aria-hidden="true" size="sm" />
      </div>
    </>
  )
}
