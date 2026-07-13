import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { CommentSection } from "@/components/comments/CommentSection"
import { AuthorBio } from "@/components/posts/AuthorBio"
import { PostHero } from "@/components/posts/PostHero"
import { PostBody } from "@/components/posts/PostBody"
import { PostJsonLd } from "@/components/posts/PostJsonLd"
import { PostReadTracker } from "@/components/posts/PostReadTracker"
import { ReadingProgress } from "@/components/posts/ReadingProgress"
import { TableOfContents } from "@/components/posts/TableOfContents"
import { extractHeadings } from "@/lib/postHeadings"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { prisma } from "@/lib/prisma"
import {
  getCachedPublishedPost,
  type PublishedPostDetail,
} from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"
import { EventAnthologyView } from "@/components/events/EventAnthologyView"

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
    ogImage: post.coverUrl || undefined,
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
  const creditAuthors = [post.author, ...post.coAuthors.map(c => c.user)]
  const authorCreditsOverflow = creditAuthors.length > 3

  const content = post.content as JSONContent
  const hasTableOfContents = extractHeadings(content).length > 0
  const fallbackTags = [
    { name: "Animation Analysis", slug: "animation-analysis" },
    { name: "Sakuga", slug: "sakuga" },
  ]
  const tags =
    post.tags.length > 0 ? post.tags.map(({ tag }) => tag) : fallbackTags

  if (post.finalAwardEvent) {
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
        <EventAnthologyView event={post.finalAwardEvent} />
        <div className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
          <CommentSection
            initialComments={post.comments}
            postId={post.id}
            postSlug={post.slug}
            postAuthorUsernames={authors}
          />
        </div>
      </>
    )
  }

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

      <div className="relative w-full z-0 pointer-events-none h-0">
        <div className="absolute top-0 left-0 right-0 h-32 md:h-48 lg:h-64 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="flex-1 w-full max-w-[1440px] mx-auto xl:px-12 flex justify-center pt-0 pb-20 relative z-10">
        <main className="w-full max-w-[1000px] px-4 md:px-5 xl:px-0">
          <header className="flex flex-col">
            <ScrollReveal delay={0.1}>
              {post.coverAlt && (
                <div className="-mt-1 mb-1 pr-1 text-right text-[13px] md:text-[14px] font-medium text-text-tertiary italic">
                  {post.coverAlt}
                </div>
              )}
              <div className="flex overflow-x-auto whitespace-nowrap hide-scrollbar items-center gap-[6px] pb-1">
                {tags.map((tag) => (
                  <Link
                    href={`/tag/${tag.slug}`}
                    key={tag.slug}
                    className="hover-glitch px-[12px] py-[6px] bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold rounded-full cursor-pointer"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </header>

          <article className="mt-6 md:mt-12 w-full mx-auto text-text-primary font-lora text-[16px] md:text-[17.5px] leading-[1.75] md:leading-[1.8] post-content">
            <ScrollReveal delay={0.2}>
              <div className="relative z-30 mb-8 overflow-hidden rounded-[16px] border border-border-default/60 bg-background/90 px-4 py-5 backdrop-blur-sm sm:mb-12 sm:rounded-[8px] sm:bg-subtle-bg/90 sm:p-8 md:p-12">
                <PostBody content={content} />
              </div>
            </ScrollReveal>
          </article>

          <div className="w-full mx-auto font-lora text-[16px] md:text-[17.5px]">
            <div className="font-sans text-text-primary">
              <ScrollReveal delay={0.3}>
                <div className="relative mt-12 md:mt-16">
                  <div
                    aria-label="Tác giả bài viết"
                    className={cn(
                      "gap-4",
                      creditAuthors.length === 1
                        ? "block"
                        : "flex overflow-x-auto pb-3 pr-12 [scroll-snap-type:x_mandatory] [scrollbar-width:thin]",
                      !authorCreditsOverflow && creditAuthors.length > 1 &&
                        "sm:grid sm:overflow-visible sm:pb-0 sm:pr-0",
                      creditAuthors.length === 2 && "sm:grid-cols-2",
                      creditAuthors.length === 3 && "sm:grid-cols-3",
                    )}
                    data-testid="author-credit-list"
                  >
                    {creditAuthors.map(author => (
                      <AuthorBio
                        className={cn(
                          "min-w-0 shrink-0 basis-[82%] snap-start sm:basis-[46%]",
                          authorCreditsOverflow
                            ? "lg:basis-[31%]"
                            : "sm:w-auto sm:shrink sm:basis-auto",
                          creditAuthors.length === 1 && "w-full basis-full",
                        )}
                        key={author.username}
                        author={author}
                      />
                    ))}
                  </div>

                  {creditAuthors.length > 1 && (
                    <>
                      <div
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute bottom-3 right-0 top-0 w-16 bg-gradient-to-l from-background via-background/75 to-transparent sm:hidden",
                          authorCreditsOverflow && "sm:block",
                        )}
                      />
                      <div
                        className={cn(
                          "mt-1 text-right text-[11px] font-medium text-text-tertiary sm:hidden",
                          authorCreditsOverflow && "sm:block",
                        )}
                      >
                        Kéo ngang để xem thêm →
                      </div>
                    </>
                  )}
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
            </div>
          </div>
        </main>

        {hasTableOfContents && (
          <aside className="hidden w-[200px] shrink-0 xl:block ml-10 mt-12 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
            <ScrollReveal delay={0.5}>
              <TableOfContents content={content} />
            </ScrollReveal>
          </aside>
        )}
      </div>
    </>
  )
}
