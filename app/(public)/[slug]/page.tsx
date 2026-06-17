import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { CommentSection } from "@/components/comments/CommentSection"
import { PageContainer } from "@/components/layout/PageContainer"
import { AuthorBio } from "@/components/posts/AuthorBio"
import { PostBody } from "@/components/posts/PostBody"
import { PostHeader } from "@/components/posts/PostHeader"
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
      <PageContainer
        as="div"
        className="flex justify-center pb-20 pt-8 md:pt-12"
        size="wide"
      >
        <div className="flex w-full max-w-[800px] flex-col gap-[48px] xl:max-w-[1048px] xl:flex-row">
          <article className="min-w-0 flex-1 max-w-[800px]">
            <PostHeader post={post} authorUsernames={authors} />
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
          <aside className="hidden w-[200px] shrink-0 xl:block">
            <TableOfContents content={content} />
          </aside>
        </div>
      </PageContainer>
    </>
  )
}
