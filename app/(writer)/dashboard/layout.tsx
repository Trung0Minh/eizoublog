import type { Metadata } from "next"
import Link from "next/link"
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

  if (!session) {
    redirect("/login")
  }

  return (
    <>
      <div className="mx-auto w-full max-w-4xl px-4 pt-6 md:px-6 lg:px-8">
        <nav
          aria-label="Dashboard navigation"
          className="mb-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b pb-4 text-sm"
        >
          <Link
            className="whitespace-nowrap px-0 py-2 text-muted-foreground transition-colors hover:text-foreground"
            href="/dashboard"
            prefetch={false}
          >
            Bài viết của tôi
          </Link>
          <Link
            className="whitespace-nowrap px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            href="/dashboard/profile"
            prefetch={false}
          >
            Chỉnh sửa hồ sơ
          </Link>
          <Link
            className="ml-auto whitespace-nowrap px-0 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            href={`/authors/${session.user.username}`}
            target="_blank"
          >
            Xem hồ sơ công khai
          </Link>
        </nav>
      </div>
      {children}
    </>
  )
}
