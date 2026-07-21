"use client"

import { usePathname } from "next/navigation"

import { DurabilityBanner } from "@/components/durability/DurabilityBanner"

export function DashboardDurabilitySlot() {
  const pathname = usePathname()

  if (pathname.startsWith("/dashboard/preview/")) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-4 md:px-6 lg:px-8">
      <DurabilityBanner scope="writer" />
    </div>
  )
}
