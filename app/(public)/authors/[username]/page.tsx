import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/layout/PageContainer"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { CompactPostList } from "@/components/posts/CompactPostList"
import { PostSortTabs } from "@/components/posts/PostSortTabs"
import { StaticPostContent } from "@/components/posts/StaticPostContent"
import { RoleBadges } from "@/components/profile/RoleBadges"
import {
  getCachedAuthorByUsername,
  getCachedAuthorPosts,
} from "@/lib/queries"
import { parsePostListSort } from "@/lib/postListSort"
import { buildMetadata } from "@/lib/seo"

interface AuthorPageProps {
  params: Promise<{ username: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)
  const author = await getCachedAuthorByUsername(username)

  if (!author) {
    return buildMetadata({ canonicalPath: `/authors/${username}`, noIndex: true })
  }

  return buildMetadata({
    canonicalPath: `/authors/${username}`,
    description: author.bio ?? `Các bài viết của ${author.name}.`,
    ogImage: author.avatarUrl ?? undefined,
    title: author.name,
  })
}

import type { JSONContent } from "@tiptap/react"

/** Strip image/video/embed/hr nodes from Tiptap JSON so bios only show text. */
function stripMediaNodes(node: JSONContent): JSONContent {
  return {
    ...node,
    content: node.content
      ?.filter(
        (child) =>
          child.type !== "image" &&
          child.type !== "customImage" &&
          child.type !== "imageGallery" &&
          child.type !== "videoEmbed" &&
          child.type !== "horizontalRule",
      )
      .map(stripMediaNodes),
  }
}

export default async function AuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const [{ username: rawUsername }, { page: pageParam, sort: sortParam }] = await Promise.all([
    params,
    searchParams,
  ])
  const username = decodeURIComponent(rawUsername)
  const page = parsePage(pageParam)
  const sort = parsePostListSort(sortParam)
  const [author, { posts, total }] = await Promise.all([
    getCachedAuthorByUsername(username),
    getCachedAuthorPosts(username, page, PAGE_SIZE, sort),
  ])

  if (!author) {
    notFound()
  }

  return (
    <PageContainer>
      <section className="mb-10 flex items-start gap-4 border-b pb-8">
        {author.avatarUrl ? (
          <img
            alt={author.name}
            className="h-16 w-16 shrink-0 rounded-full object-cover border border-border-default bg-subtle-bg"
            decoding="async"
            loading="lazy"
            src={author.avatarUrl}
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-full flex items-center justify-center text-xl font-bold bg-[#2d6e7e] text-white border-2 border-background shadow-sm">
            {author.name.charAt(0)}
          </div>
        )}
        <div>
        <ScrollReveal>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              <TextReveal text={author.name} />
            </h1>
            <RoleBadges
              badgeClassName="rounded-md text-[11px]"
              displayRoleColor={author.displayRoleColor}
              displayRoleName={author.displayRoleName}
              role={author.role}
            />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            @{author.username}
          </p>
          {author.bio && (
            <div className="contributor-bio mt-3 max-w-2xl text-sm leading-relaxed">
              {(() => {
                if (author.bio.startsWith("{")) {
                  try {
                    const json = JSON.parse(author.bio) as JSONContent
                    return <StaticPostContent content={stripMediaNodes(json)} />
                  } catch {}
                }
                return <p>{author.bio}</p>
              })()}
            </div>
          )}
        </ScrollReveal>
        </div>
      </section>

      <ScrollReveal delay={0.2}>
        <section className="space-y-6">
          <div className="flex justify-end">
            <PostSortTabs basePath={`/authors/${username}`} sort={sort} />
          </div>
        <CompactPostList
          emptyMessage="Tác giả này chưa có bài viết nào được xuất bản."
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            query: { sort: sort === "latest" ? undefined : sort },
            total,
          }}
          posts={posts}
        />
        </section>
      </ScrollReveal>
    </PageContainer>
  )
}
