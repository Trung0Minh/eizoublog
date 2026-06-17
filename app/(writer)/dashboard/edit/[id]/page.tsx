import { notFound, redirect } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { PostEditor } from "@/components/posts/PostEditor"
import { prisma } from "@/lib/prisma"
import { getCachedEditorReferenceData } from "@/lib/queries"
import { getCurrentSession } from "@/lib/session"

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const [post, referenceData] = await Promise.all([
    prisma.post.findUnique({
      select: {
        authorId: true,
        categoryId: true,
        coAuthors: { select: { userId: true, status: true } },
        content: true,
        contentText: true,
        coverAlt: true,
        coverUrl: true,
        draftVisibility: true,
        excerpt: true,
        id: true,
        status: true,
        tags: {
          select: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        title: true,
      },
      where: { id },
    }),
    getCachedEditorReferenceData(),
  ])

  if (!post) {
    notFound()
  }

  if (post.status === "ARCHIVED") {
    notFound()
  }

  const isCoAuthor = post.coAuthors.some((ca) => ca.userId === session.user.id && ca.status === "ACCEPTED")
  const canEdit =
    session.user.role === "ADMIN" || session.user.id === post.authorId || isCoAuthor

  if (!canEdit) {
    notFound()
  }

  return (
    <PostEditor
      categories={referenceData.categories}
      currentUserId={session.user.id}
      initialData={{
        categoryId: post.categoryId,
        coAuthorIds: post.coAuthors.map(({ userId }) => userId),
        coAuthors: post.coAuthors,
        authorId: post.authorId,
        content: post.content as JSONContent,
        contentText: post.contentText,
        coverAlt: post.coverAlt,
        coverUrl: post.coverUrl,
        excerpt: post.excerpt,
        id: post.id,
        status: post.status,
        tags: post.tags.map(({ tag }) => tag),
        title: post.title,
      }}
      writers={referenceData.writers}
    />
  )
}
