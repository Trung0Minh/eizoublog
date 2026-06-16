import { notFound } from "next/navigation"

import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminEventDetailManager } from "@/components/events/AdminEventDetailManager"
import { awardEventDetailSelect } from "@/lib/awardEventService"
import { prisma } from "@/lib/prisma"

interface AdminEventPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEventPage({ params }: AdminEventPageProps) {
  const { id } = await params
  const event = await prisma.awardEvent.findUnique({
    select: awardEventDetailSelect,
    where: { id },
  })

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
