import type { JSONContent } from "@tiptap/react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { PostArticleView } from "@/components/posts/PostArticleView"
import { canViewPost } from "@/lib/postAccess"
import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/lib/session"

interface DashboardPostPreviewPageProps {
  params: Promise<{ id: string }>
}

export default async function DashboardPostPreviewPage({
  params,
}: DashboardPostPreviewPageProps) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const post = await prisma.post.findUnique({
    select: {
      _count: { select: { comments: true } },
      author: {
        select: {
          avatarUrl: true,
          bio: true,
          id: true,
          name: true,
          username: true,
        },
      },
      authorId: true,
      category: { select: { name: true, slug: true } },
      coAuthors: {
        select: {
          status: true,
          user: {
            select: {
              avatarUrl: true,
              bio: true,
              id: true,
              name: true,
              username: true,
            },
          },
          userId: true,
        },
      },
      content: true,
      coverAlt: true,
      coverUrl: true,
      draftVisibility: true,
      excerpt: true,
      id: true,
      publishedAt: true,
      slug: true,
      status: true,
      tags: {
        select: {
          tag: { select: { name: true, slug: true } },
        },
      },
      title: true,
      updatedAt: true,
    },
    where: { id },
  })

  if (!post) {
    notFound()
  }

  if (!canViewPost(post, session.user.id, session.user.role)) {
    notFound()
  }

  const content = post.content as JSONContent
  const authorUsernames = [
    post.author.username,
    ...post.coAuthors.map(({ user }) => user.username),
  ]

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4">
        <div
          className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-border-default bg-background/95 px-4 py-2.5 text-sm text-text-secondary shadow-lg backdrop-blur-xl"
          role="status"
        >
          <span className="truncate">Previewing the latest saved version.</span>
          <Link
            className="shrink-0 font-bold text-accent transition-colors hover:text-accent/80"
            href={`/dashboard/edit/${post.id}`}
          >
            Edit post
          </Link>
        </div>
      </div>
      <PostArticleView
        authorUsernames={authorUsernames}
        content={content}
        post={post}
      />
    </>
  )
}
