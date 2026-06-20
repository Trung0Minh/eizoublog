import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminContentManager } from "@/components/admin/AdminContentManager"
import { getCachedAdminContentData } from "@/lib/queries"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

export default async function AdminContentPage() {
  const { categories, tags } = await getCachedAdminContentData()

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        subtitle="Manage categories and tags used by posts."
        title="Content"
      />
      <ScrollReveal index={0} className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6">
        <AdminContentManager categories={categories} tags={tags} />
      </ScrollReveal>
    </div>
  )
}
