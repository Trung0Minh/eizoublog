import { notFound } from "next/navigation"

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
      <AdminPageHeader
        subtitle="Manage writer rooms, shuffle the final order, and publish the merged event post."
        title={event.title}
      />
      <AdminEventDetailManager event={event} />
    </div>
  )
}
