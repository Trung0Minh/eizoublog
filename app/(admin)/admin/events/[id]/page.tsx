import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminEventDetailManager } from "@/components/events/AdminEventDetailManager"
import { getCachedAdminEventDetail } from "@/lib/queries"

interface AdminEventPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEventPage({ params }: AdminEventPageProps) {
  const { id } = await params
  const event = await getCachedAdminEventDetail(id)

  if (!event) {
    notFound()
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <Link
          href="/admin/events"
          className="inline-flex items-center text-[13px] font-semibold text-text-secondary transition-colors hover:text-accent"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>
      </div>
      <AdminPageHeader
        subtitle="Manage writer rooms, shuffle the final order, and publish the merged event post."
        title={event.title}
      />
      <AdminEventDetailManager event={event} />
    </div>
  )
}
