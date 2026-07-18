import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminEventsManager } from "@/components/events/AdminEventsManager"
import { getCachedAdminEventsData } from "@/lib/queries"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

export default async function AdminEventsPage() {
  const { categories, events, tags } = await getCachedAdminEventsData()

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        subtitle="Open annual writing events, collect writer rooms, and publish one merged article."
        title="Events"
      />
      <ScrollReveal index={0} className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-3 sm:p-6">
        <AdminEventsManager categories={categories} events={events} tags={tags} />
      </ScrollReveal>
    </div>
  )
}
