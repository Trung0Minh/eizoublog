"use client"

import { usePathname } from "next/navigation"

import { AmbientBackground } from "@/components/ui/AmbientBackground"
import { CustomCursor } from "@/components/ui/CustomCursor"
import { SeasonalEffects } from "@/components/ui/SakuraFalling"

export function GlobalEffects() {
  const pathname = usePathname()
  const isToolRoute = pathname.startsWith("/admin")

  if (isToolRoute) {
    return <SeasonalEffects />
  }

  return (
    <>
      <AmbientBackground />
      <SeasonalEffects />
      <CustomCursor />
    </>
  )
}
