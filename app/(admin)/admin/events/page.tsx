import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminEventsManager } from "@/components/events/AdminEventsManager"
import { awardEventListSelect } from "@/lib/awardEventService"
import { prisma } from "@/lib/prisma"

export default async function AdminEventsPage() {
  const [events, categories, tags] = await Promise.all([
    prisma.awardEvent.findMany({
      orderBy: { createdAt: "desc" },
      select: awardEventListSelect,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        subtitle="Open annual writing events, collect writer rooms, and publish one merged article."
        title="Events"
      />
      <AdminEventsManager categories={categories} events={events} tags={tags} />
    </div>
  )
}
