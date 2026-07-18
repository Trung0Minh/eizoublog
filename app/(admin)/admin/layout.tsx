import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { getCurrentSession } from "@/lib/session"
import { DurabilityBanner } from "@/components/durability/DurabilityBanner"

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Admin",
}

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const menuUser = session.user.username
    ? {
        avatarUrl: session.user.avatarUrl ?? null,
        name: session.user.name ?? session.user.username,
        role: session.user.role,
        username: session.user.username,
      }
    : null

  return (
    <div className="relative flex h-screen gap-6 overflow-hidden bg-transparent p-2 font-sans text-text-primary sm:p-4 md:p-6 lg:p-8">
      <AdminSidebar user={menuUser} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute top-0 right-0 z-50">
          <AdminHeader user={menuUser} />
        </div>
        <main className="admin-workspace w-full h-full flex-1 rounded-[32px] border border-border-default/50 bg-background/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="scrollbar-none relative z-10 h-full overflow-y-auto px-3 pb-8 pt-16 sm:px-6 md:px-10 md:py-12">
            <DurabilityBanner scope="admin" />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
