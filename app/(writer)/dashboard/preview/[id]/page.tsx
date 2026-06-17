import type { JSONContent } from "@tiptap/react"
import { notFound, redirect } from "next/navigation"

import { PageContainer } from "@/components/layout/PageContainer"
import { PostBody } from "@/components/posts/PostBody"
import { PostContentFrame } from "@/components/posts/PostContentFrame"
import { PostHeader } from "@/components/posts/PostHeader"
import { TableOfContents } from "@/components/posts/TableOfContents"
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

  return (
    <PageContainer
      as="div"
      className="flex justify-center pb-20 pt-8 md:pt-12"
      size="wide"
    >
      <div className="flex w-full max-w-[800px] flex-col gap-[48px] xl:max-w-[1048px] xl:flex-row">
        <article className="max-w-[800px] min-w-0 flex-1">
          <div className="mb-6 rounded-[6px] border border-border-default bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Previewing saved post content. Edit changes from My posts.
          </div>
          <PostContentFrame>
            <PostHeader post={post} />
            <PostBody content={content} />
          </PostContentFrame>
        </article>
        <aside className="hidden w-[200px] shrink-0 xl:block">
          <TableOfContents content={content} />
        </aside>
      </div>
    </PageContainer>
  )
}
