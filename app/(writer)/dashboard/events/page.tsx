import { redirect } from "next/navigation"

import { WriterEventsList } from "@/components/events/WriterEventsList"
import { getCurrentSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export default async function DashboardEventsPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const events = await prisma.awardEvent.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      _count: { select: { rooms: true } },
      finalPost: { select: { slug: true } },
      id: true,
      rooms: {
        select: { id: true, status: true },
        where: { writerId: session.user.id },
      },
      status: true,
      title: true,
    },
    where: { status: { in: ["OPEN", "PUBLISHED"] } },
  })

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Writing events
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Event rooms</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join open writing events and submit your own section for the final article.
        </p>
      </div>
      <WriterEventsList events={events} />
    </main>
  )
}
