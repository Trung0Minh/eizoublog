import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/AdminNav"
import { getCurrentSession } from "@/lib/session"

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
    <div className="min-h-screen bg-background font-sans text-text-primary">
      <AdminNav user={menuUser} />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
