import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { PostEditor } from "@/components/posts/PostEditor"
import { prisma } from "@/lib/prisma"
import { getCachedEditorReferenceData } from "@/lib/queries"
import { getCurrentSession } from "@/lib/session"

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EditPostPageProps): Promise<Metadata> {
  const { id } = await params
  const post = await prisma.post.findUnique({
    select: { title: true },
    where: { id },
  })

  return {
    title: post?.title ?? "Chỉnh sửa bài viết",
  }
}

export default async function EditPostPage({
  params,
}: EditPostPageProps) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const [post, referenceData] = await Promise.all([
    prisma.post.findUnique({
      select: {
        authorId: true,
        awardEventRooms: {
          select: {
            event: { select: { id: true, status: true, title: true } },
            visibility: true,
          },
          take: 1,
          where: { writerId: session.user.id },
        },
        categoryId: true,
        coAuthors: { select: { userId: true, status: true } },
        content: true,
        contentText: true,
        coverAlt: true,
        coverUrl: true,
        draftVisibility: true,
        excerpt: true,
        excerptContent: true,
        id: true,
        status: true,
        tags: {
          select: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        title: true,
        version: true,
      },
      where: { id },
    }),
    getCachedEditorReferenceData(),
  ])

  if (!post) {
    notFound()
  }

  if (post.status === "ARCHIVED" || post.status === "REMOVED") {
    notFound()
  }

  const isCoAuthor = post.coAuthors.some((ca) => ca.userId === session.user.id && ca.status === "ACCEPTED")
  const canEdit =
    session.user.role === "ADMIN" || session.user.id === post.authorId || isCoAuthor

  if (!canEdit) {
    notFound()
  }

  const eventRoom = post.awardEventRooms[0]

  return (
    <PostEditor
      canPublish={session.user.id === post.authorId}
      canRestoreRevisions={session.user.role === "ADMIN" || session.user.id === post.authorId}
      categories={referenceData.categories}
      currentUserId={session.user.id}
      eventAssignment={
        eventRoom
          ? {
              eventId: eventRoom.event.id,
              eventStatus: eventRoom.event.status,
              eventTitle: eventRoom.event.title,
              visibility: eventRoom.visibility,
            }
          : undefined
      }
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
        excerptContent: post.excerptContent as JSONContent | null,
        id: post.id,
        status: post.status,
        tags: post.tags.map(({ tag }) => tag),
        title: post.title,
        version: post.version,
      }}
      writers={referenceData.writers}
    />
  )
}
