import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AdminContentManager } from "@/components/admin/AdminContentManager"
import { prisma } from "@/lib/prisma"

const categorySelect = {
  _count: { select: { children: true, posts: true } },
  children: {
    orderBy: { name: "asc" },
    select: {
      _count: { select: { children: true, posts: true } },
      description: true,
      id: true,
      name: true,
      parentId: true,
      slug: true,
    },
  },
  description: true,
  id: true,
  name: true,
  parentId: true,
  slug: true,
} as const

const tagSelect = {
  _count: { select: { posts: true } },
  id: true,
  name: true,
  slug: true,
} as const

export default async function AdminContentPage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: categorySelect,
      where: { parentId: null },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: tagSelect,
    }),
  ])

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
