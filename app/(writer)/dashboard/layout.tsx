import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DashboardDurabilitySlot } from "@/components/layout/DashboardDurabilitySlot"
import { getCurrentSession } from "@/lib/session"
import { getAppName } from "@/lib/seo"

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: {
    default: "Bảng điều khiển",
    template: `%s | ${getAppName()}`,
  },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "WRITER")) {
    redirect("/login")
  }

  return <>
    <DashboardDurabilitySlot />
    {children}
  </>
}
