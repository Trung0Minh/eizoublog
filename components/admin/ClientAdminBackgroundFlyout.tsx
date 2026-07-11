"use client"

import dynamic from "next/dynamic"

import { useAdminAccess } from "@/lib/clientSession"

const AdminBackgroundFlyout = dynamic(
  () =>
    import("@/components/admin/AdminBackgroundFlyout").then(
      (module) => module.AdminBackgroundFlyout,
    ),
  { ssr: false },
)

export function ClientAdminBackgroundFlyout() {
  const isAdmin = useAdminAccess()

  return isAdmin ? <AdminBackgroundFlyout /> : null
}
