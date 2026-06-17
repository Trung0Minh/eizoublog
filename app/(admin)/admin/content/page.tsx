import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminContentManager } from "@/components/admin/AdminContentManager"
import { getCachedAdminContentData } from "@/lib/queries"

export default async function AdminContentPage() {
  const { categories, tags } = await getCachedAdminContentData()

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        subtitle="Manage categories and tags used by posts."
        title="Content"
      />
      <AdminContentManager categories={categories} tags={tags} />
    </div>
  )
}
