import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { PostEditor } from "@/components/posts/PostEditor"
import { getCachedEditorReferenceData } from "@/lib/queries"
import { getCurrentSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Bài viết mới",
}

export default async function NewPostPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const { categories, writers } = await getCachedEditorReferenceData()

  return (
    <PostEditor
      categories={categories}
      currentUserId={session.user.id}
      writers={writers}
    />
  )
}
