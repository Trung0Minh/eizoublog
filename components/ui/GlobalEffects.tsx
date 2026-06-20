"use client"

import { usePathname } from "next/navigation"

import { AmbientBackground } from "@/components/ui/AmbientBackground"
import { AnimatedDecorators } from "@/components/ui/AnimatedDecorators"
import { CustomCursor } from "@/components/ui/CustomCursor"
import { NoiseOverlay } from "@/components/ui/NoiseOverlay"
import { ReadingProgress } from "@/components/ui/ReadingProgress"
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
      <AnimatedDecorators />
      <SeasonalEffects />
      <CustomCursor />
      <ReadingProgress />
    </>
  )
}
