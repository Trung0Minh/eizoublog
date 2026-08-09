import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { AdminEventPreviewShell } from "@/components/events/AdminEventPreviewShell"
import { EventAnthologyView } from "@/components/events/EventAnthologyView"
import { awardEventDetailSelect } from "@/lib/awardEventService"
import { prisma } from "@/lib/prisma"

export default async function AdminEventPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await prisma.awardEvent.findUnique({
    select: awardEventDetailSelect,
    where: { id },
  })

  if (!event) notFound()

  return (
    <AdminEventPreviewShell>
      <div className="sticky top-0 z-[60] h-0 px-4 pt-4 sm:px-6">
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-border-default bg-background/90 px-4 py-2 text-sm font-semibold backdrop-blur-xl transition-colors hover:text-accent"
          href={`/admin/events/${event.id}`}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to event controls
        </Link>
      </div>
      <EventAnthologyView event={event} preview />
    </AdminEventPreviewShell>
  )
}
