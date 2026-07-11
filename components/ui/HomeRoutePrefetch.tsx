"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export function HomeRoutePrefetch() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === "/") return

    const prefetchHome = () => router.prefetch("/")

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchHome, { timeout: 2_000 })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = setTimeout(prefetchHome, 1_000)
    return () => clearTimeout(timeoutId)
  }, [pathname, router])

  return null
}
