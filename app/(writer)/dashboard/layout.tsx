import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/session"

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Bảng điều khiển",
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

  return <>{children}</>
}
