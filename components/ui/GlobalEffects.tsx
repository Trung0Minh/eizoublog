"use client"

import { usePathname } from "next/navigation"

import { AmbientBackground } from "@/components/ui/AmbientBackground"
import { CustomCursor } from "@/components/ui/CustomCursor"
import { NoiseOverlay } from "@/components/ui/NoiseOverlay"
import { SeasonalEffects } from "@/components/ui/SakuraFalling"

export function GlobalEffects() {
  const pathname = usePathname()
  const isToolRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/edit") ||
    pathname.startsWith("/dashboard/new")

  if (isToolRoute) {
    return null
  }

  return (
    <>
      <NoiseOverlay />
      <AmbientBackground />
      <SeasonalEffects />
      <CustomCursor />
    </>
  )
}
