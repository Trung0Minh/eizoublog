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
import { ReadingProgress } from "@/components/posts/ReadingProgress"
import { TableOfContents } from "@/components/posts/TableOfContents"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
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
  const fallbackTags = [
    { name: "Animation Analysis", slug: "animation-analysis" },
    { name: "Sakuga", slug: "sakuga" },
  ]
  const tags =
    post.tags.length > 0 ? post.tags.map(({ tag }) => tag) : fallbackTags

  return (
    <>
      <ReadingProgress />
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
            <ScrollReveal delay={0.1}>
              {post.coverAlt && (
                <div className="text-right text-[11px] text-text-tertiary italic mb-4">
                  {post.coverAlt}
                </div>
              )}
              <div className="flex flex-wrap gap-[6px]">
                {tags.map((tag) => (
                  <span key={tag.slug} className="px-[12px] py-[6px] bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold rounded-full hover:bg-accent hover:text-white transition-colors cursor-pointer">
                    {tag.name}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </header>

          <article className="mt-12 max-w-[68ch] mx-auto text-text-primary font-lora text-[16px] md:text-[17.5px] leading-[1.75] md:leading-[1.8] post-content">
            <ScrollReveal delay={0.2}>
              <div className="bg-background rounded-[24px] border border-border-default/50 shadow-sm p-6 sm:p-8 md:p-12 mb-12 relative z-10">
                <PostBody content={content} />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="mt-12 md:mt-16 flex flex-col gap-4">
                {[post.author, ...post.coAuthors.map(c => c.user)].map(author => (
                  <AuthorBio key={author.username} author={author} />
                ))}
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.4}>
              <CommentSection
                initialComments={post.comments}
                postId={post.id}
                postSlug={post.slug}
                postAuthorUsernames={authors}
              />
            </ScrollReveal>
          </article>
        </main>

        <aside className="hidden w-[200px] shrink-0 xl:block ml-10 mt-12">
          <ScrollReveal delay={0.5}>
            <TableOfContents content={content} />
          </ScrollReveal>
        </aside>
      </div>
    </>
  )
}
