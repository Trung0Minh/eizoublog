"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function RouteScrollReset() {
  const pathname = usePathname()
  const previousPathnameRef = useRef(pathname)

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return
    }

    previousPathnameRef.current = pathname

    requestAnimationFrame(() => {
      window.scrollTo({ left: 0, top: 0, behavior: "instant" })
    })
  }, [pathname])

  return null
}
