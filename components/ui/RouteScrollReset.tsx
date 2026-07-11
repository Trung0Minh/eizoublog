"use client"

import { useLayoutEffect } from "react"
import { usePathname } from "next/navigation"

export function RouteScrollReset() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    history.scrollRestoration = "manual"
    window.scrollTo({ left: 0, top: 0, behavior: "instant" })
  }, [pathname])

  return null
}
