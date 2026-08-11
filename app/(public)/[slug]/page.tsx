import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { CommentSection } from "@/components/comments/CommentSection"
import { PostArticleView } from "@/components/posts/PostArticleView"
import { PostInlineActions } from "@/components/posts/PostInlineActions"
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

export const dynamic = "force-dynamic"

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
    const event = post.finalAwardEvent
    const roomEditHrefByUsername = Object.fromEntries(
      event.rooms
        .filter((room) => room.selectedPost && room.selectedPost.status !== "REMOVED")
        .map((room) => [
          room.writer.username,
          `/dashboard/edit/${room.selectedPost?.id}`,
        ]),
    )
    const eventAuthorUsernames = Array.from(
      new Set([
        ...authors,
        ...event.rooms
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
        <EventAnthologyView
          event={event}
          postActions={
            <PostInlineActions
              authorUsernames={authors}
              editHrefByUsername={roomEditHrefByUsername}
              eventSettingsHref={`/admin/events/${event.id}`}
              featuredAt={post.featuredAt}
              postId={post.id}
              status={post.status}
            />
          }
        />
        <div
          className="mx-auto grid w-full max-w-[1440px] gap-8 pb-24 lg:grid-cols-[minmax(0,1100px)] lg:justify-center 2xl:grid-cols-[minmax(0,1100px)_220px]"
          data-testid="event-comments"
        >
          <div className="min-w-0 px-4 md:px-6">
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
