import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { CommentSection } from "@/components/comments/CommentSection"
import { PostArticleView } from "@/components/posts/PostArticleView"
import { PostJsonLd } from "@/components/posts/PostJsonLd"
import { PostReadTracker } from "@/components/posts/PostReadTracker"
import { ReadingProgress } from "@/components/posts/ReadingProgress"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import {
  getCachedPublishedPost,
  type PublishedPostDetail,
} from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"
import { EventAnthologyView } from "@/components/events/EventAnthologyView"

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateStaticParams() {
  return []
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

  const content = post.content as JSONContent

  if (post.finalAwardEvent) {
    const eventAuthorUsernames = Array.from(
      new Set([
        ...authors,
        ...post.finalAwardEvent.rooms
          .filter(
            ({ selectedPost }) =>
              selectedPost && selectedPost.status !== "REMOVED",
          )
          .map(({ writer }) => writer.username),
      ]),
    )

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
        <div
          className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1000px)] lg:justify-start lg:px-10 2xl:max-w-[1360px] 2xl:grid-cols-[minmax(0,1000px)_220px] 2xl:pl-20 2xl:pr-0"
          data-testid="event-comments"
        >
          <div className="min-w-0">
            <CommentSection
              initialComments={post.comments}
              postId={post.id}
              postSlug={post.slug}
              postAuthorUsernames={eventAuthorUsernames}
            />
          </div>
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
      <PostArticleView authorUsernames={authors} content={content} post={post}>
        <ScrollReveal delay={0.4}>
          <CommentSection
            initialComments={post.comments}
            postId={post.id}
            postSlug={post.slug}
            postAuthorUsernames={authors}
          />
        </ScrollReveal>
      </PostArticleView>
    </>
  )
}
