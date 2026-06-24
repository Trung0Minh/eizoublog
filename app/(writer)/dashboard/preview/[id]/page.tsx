import type { JSONContent } from "@tiptap/react"
import { notFound, redirect } from "next/navigation"

import { PostHero } from "@/components/posts/PostHero"
import { PostBody } from "@/components/posts/PostBody"
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
    <>
      {/* We render the Hero outside the restricted width to allow full screen bleed if needed */}
      <div className="mb-6 mx-auto max-w-[1440px] px-4 md:px-12 pt-8">
        <div className="rounded-[6px] border border-border-default bg-muted/30 px-4 py-3 text-sm text-text-secondary">
          Previewing saved post content. Edit changes from My posts.
        </div>
      </div>

      <PostHero post={post} />

      <div className="flex-1 w-full max-w-[1440px] mx-auto xl:px-12 flex justify-center pt-8 pb-20 relative">
        <main className="w-full max-w-[720px] px-5 xl:px-0">
          <header className="flex flex-col">
            {post.coverAlt && (
              <div className="text-right text-[11px] text-text-tertiary italic mb-4">
                {post.coverAlt}
              </div>
            )}
            <div className="flex flex-wrap gap-[6px]">
              {post.tags.map(({ tag }) => (
                <span key={tag.slug} className="px-[12px] py-[6px] bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold rounded-full hover:bg-accent hover:text-white transition-colors cursor-pointer">
                  {tag.name}
                </span>
              ))}
            </div>
          </header>

          <article className="mt-12 max-w-[68ch] mx-auto text-text-primary font-lora text-[16px] md:text-[17.5px] leading-[1.75] md:leading-[1.8] post-content">
            <PostBody content={content} />
          </article>
        </main>

        <aside className="hidden w-[200px] shrink-0 xl:block ml-10 mt-12">
          <TableOfContents content={content} />
        </aside>
      </div>
    </>
  )
}
