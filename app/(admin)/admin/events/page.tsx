import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminEventsManager } from "@/components/events/AdminEventsManager"
import { getCachedAdminEventsData } from "@/lib/queries"

export default async function AdminEventsPage() {
  const { categories, events, tags } = await getCachedAdminEventsData()

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
