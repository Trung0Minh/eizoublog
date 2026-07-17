import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/session"
import { DurabilityBanner } from "@/components/durability/DurabilityBanner"

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

  return <>
    <div className="mx-auto w-full max-w-4xl px-4 pt-4 md:px-6 lg:px-8">
      <DurabilityBanner scope="writer" />
    </div>
    {children}
  </>
}
