import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { CommentSection } from "@/components/comments/CommentSection"
import { PageContainer } from "@/components/layout/PageContainer"
import { AuthorBio } from "@/components/posts/AuthorBio"
import { PostHero } from "@/components/posts/PostHero"
import { PostBody } from "@/components/posts/PostBody"
import { PostJsonLd } from "@/components/posts/PostJsonLd"
import { PostReadTracker } from "@/components/posts/PostReadTracker"
import { TableOfContents } from "@/components/posts/TableOfContents"
import { prisma } from "@/lib/prisma"
import {
  getCachedPublishedPost,
  type PublishedPostDetail,
} from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateStaticParams() {
  if (process.env.NODE_ENV !== "production") {
    return []
  }

  const posts: { slug: string }[] = await prisma.post.findMany({
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: { slug: true },
    take: 20,
    where: { status: "PUBLISHED" },
  })

  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = (await getCachedPublishedPost(slug)) as
    | PublishedPostDetail
    | null

  if (!post) {
    return buildMetadata({ canonicalPath: `/${slug}`, noIndex: true })
  }

  const base = buildMetadata({
    canonicalPath: `/${slug}`,
    description: post.excerpt ?? undefined,
    ogImage: post.coverUrl ?? undefined,
    ogType: "article",
    title: post.title,
  })

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      authors: [post.author.name],
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      tags: post.tags.map(({ tag }) => tag.name),
      type: "article",
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = (await getCachedPublishedPost(slug)) as
    | PublishedPostDetail
    | null

  if (!post) {
    notFound()
  }

  const authors = [post.author.username, ...post.coAuthors.map(c => c.user.username)]

  const content = post.content as JSONContent

  return (
    <>
      <PostJsonLd
        authorName={post.author.name}
        coverUrl={post.coverUrl}
        description={post.excerpt}
        publishedAt={post.publishedAt}
        slug={post.slug}
        title={post.title}
        updatedAt={post.updatedAt}
      />
      <PostReadTracker slug={post.slug} title={post.title} />

      <PostHero post={post} authorUsernames={authors} />

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

            <div className="mt-12 md:mt-16 flex flex-col gap-4">
              {[post.author, ...post.coAuthors.map(c => c.user)].map(author => (
                <AuthorBio key={author.username} author={author} />
              ))}
            </div>
            <CommentSection
              initialComments={post.comments}
              postId={post.id}
              postSlug={post.slug}
              postAuthorUsernames={authors}
            />
          </article>
        </main>

        <aside className="hidden w-[200px] shrink-0 xl:block ml-10 mt-12">
          <TableOfContents content={content} />
        </aside>
      </div>
    </>
  )
}
