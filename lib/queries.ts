import { unstable_cache } from "next/cache"
import {
  Prisma,
  type AwardEventRoomStatus,
  type AwardEventStatus,
  type CoAuthorStatus,
  type CommentStatus,
  type PostStatus,
  type Role,
} from "@prisma/client"

import {
  adminAwardEventDetailSelect,
  awardEventListSelect,
} from "@/lib/awardEventService"
import {
  getInternalDailyPageviews,
  getInternalAnalyticsStats,
  getInternalTopPages,
} from "@/lib/internalAnalytics"
import { SITE_PAGES_CACHE_TAG, getPostDetailCacheTag } from "@/lib/cacheTags"
import type { PostListSort } from "@/lib/postListSort"
import { prisma } from "@/lib/prisma"
import type { PreparedSearchQuery, SearchFilters, SearchResult } from "@/lib/search"

const sidebarCategorySelect = {
  _count: {
    select: { posts: { where: { status: "PUBLISHED" } } },
  },
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

const recentPostSelect = {
  publishedAt: true,
  slug: true,
  status: true,
  title: true,
} satisfies Prisma.PostSelect

const sidebarRecentCommentSelect = {
  authorName: true,
  content: true,
  createdAt: true,
  id: true,
  post: {
    select: {
      slug: true,
      title: true,
    },
  },
} satisfies Prisma.CommentSelect

const commandCategorySelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

const searchTagSelect = {
  _count: {
    select: { posts: { where: { post: { status: "PUBLISHED" } } } },
  },
  name: true,
  slug: true,
} satisfies Prisma.TagSelect

const searchCategoryWithCountSelect = {
  _count: {
    select: { posts: { where: { status: "PUBLISHED" } } },
  },
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

const sitePageSelect = {
  content: true,
  contentText: true,
} satisfies Prisma.SitePageSelect

type SidebarArchiveRow = {
  count: bigint
  month: string
}

const contributorSelect = {
  avatarUrl: true,
  bio: true,
  displayRoleColor: true,
  displayRoleName: true,
  id: true,
  name: true,
  username: true,
  role: true,
} satisfies Prisma.UserSelect

const publicCategorySelect = {
  description: true,
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

const publicTagSelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.TagSelect

const publicAuthorSelect = {
  avatarUrl: true,
  bio: true,
  createdAt: true,
  displayRoleColor: true,
  displayRoleName: true,
  id: true,
  name: true,
  username: true,
  role: true,
} satisfies Prisma.UserSelect

const editorCategorySelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

const editorWriterSelect = {
  id: true,
  name: true,
  username: true,
} satisfies Prisma.UserSelect

const profileUserSelect = {
  avatarOriginalUrl: true,
  avatarUrl: true,
  bio: true,
  displayRoleColor: true,
  displayRoleLocked: true,
  displayRoleName: true,
  email: true,
  name: true,
  role: true,
  username: true,
} satisfies Prisma.UserSelect

const adminWriterSelect = {
  _count: { select: { posts: true } },
  createdAt: true,
  displayRoleColor: true,
  displayRoleLocked: true,
  displayRoleName: true,
  email: true,
  id: true,
  name: true,
  role: true,
  username: true,
} satisfies Prisma.UserSelect

const pendingInviteSelect = {
  createdAt: true,
  createdBy: { select: { name: true } },
  email: true,
  expiresAt: true,
  id: true,
} satisfies Prisma.InviteSelect

const newsletterRecentPostSelect = {
  id: true,
  title: true,
} satisfies Prisma.PostSelect

const adminNewsletterBroadcastSelect = {
  completedAt: true,
  createdAt: true,
  failedCount: true,
  id: true,
  sentCount: true,
  status: true,
  subject: true,
  totalCount: true,
} satisfies Prisma.NewsletterBroadcastSelect

const adminAwardEventCategorySelect = {
  id: true,
  name: true,
} satisfies Prisma.CategorySelect

const adminAwardEventTagSelect = {
  id: true,
  name: true,
} satisfies Prisma.TagSelect

const adminContentCategorySelect = {
  _count: { select: { posts: true } },
  description: true,
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

const adminContentTagSelect = {
  _count: { select: { posts: true } },
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.TagSelect

export const publishedPostDetailSelect = {
  _count: { select: { comments: true } },
  author: {
    select: {
      avatarUrl: true,
      bio: true,
      name: true,
      username: true,
    },
  },
  category: { select: { name: true, slug: true } },
  coAuthors: {
    orderBy: { order: "asc" },
    select: {
      user: {
        select: {
          avatarUrl: true,
          bio: true,
          name: true,
          username: true,
        },
      },
    },
  },
  comments: {
    orderBy: { createdAt: "desc" },
    select: {
      author: {
        select: {
          avatarUrl: true,
          displayRoleColor: true,
          displayRoleName: true,
          role: true,
          username: true,
        },
      },
      authorName: true,
      content: true,
      createdAt: true,
      id: true,
      parentId: true,
      postId: true,
      replies: {
        orderBy: { createdAt: "desc" },
        select: {
          author: {
            select: {
              avatarUrl: true,
              displayRoleColor: true,
              displayRoleName: true,
              role: true,
              username: true,
            },
          },
          authorName: true,
          content: true,
          createdAt: true,
          id: true,
          parentId: true,
          postId: true,
          status: true,
        },
        where: { status: "APPROVED" },
      },
      status: true,
    },
    where: { parentId: null, status: "APPROVED" },
  },
  content: true,
  coverAlt: true,
  coverUrl: true,
  excerpt: true,
  excerptContent: true,
  featuredAt: true,
  finalAwardEvent: {
    select: {
      category: { select: { name: true, slug: true } },
      coverAlt: true,
      coverUrl: true,
      id: true,
      intro: true,
      introText: true,
      rooms: {
        orderBy: [{ order: "asc" }, { updatedAt: "asc" }],
        select: {
          id: true,
          order: true,
          selectedPost: {
            select: {
              content: true,
              id: true,
              status: true,
              tags: {
                select: { tag: { select: { name: true, slug: true } } },
              },
              title: true,
            },
          },
          status: true,
          submittedContent: true,
          submittedPostId: true,
          submittedPostTitle: true,
          writer: {
            select: { avatarUrl: true, bio: true, name: true, username: true },
          },
        },
        where: { excludedAt: null, status: "SUBMITTED" },
      },
      tags: {
        select: { tag: { select: { name: true, slug: true } } },
      },
      title: true,
    },
  },
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
} satisfies Prisma.PostSelect

export interface PublishedPostListItem {
  _count: { comments: number }
  author: { avatarUrl: string | null; name: string; username: string }
  category: { id: string; name: string; slug: string } | null
  coAuthors: {
    user: { avatarUrl: string | null; name: string; username: string }
  }[]
  coverAlt: string | null
  coverUrl: string | null
  excerpt: string | null
  featuredAt: Date | null
  publishedAt: Date | null
  slug: string
  tags: { tag: { id: string; name: string; slug: string } }[]
  title: string
}
export type PublishedPostDetail = Prisma.PostGetPayload<{
  select: typeof publishedPostDetailSelect
}>
export type PublicAuthor = Prisma.UserGetPayload<{
  select: typeof publicAuthorSelect
}>
export type PublicCategory = Prisma.CategoryGetPayload<{
  select: typeof publicCategorySelect
}>
export type PublicTag = Prisma.TagGetPayload<{
  select: typeof publicTagSelect
}>
export type SidebarRecentComment = Prisma.CommentGetPayload<{
  select: typeof sidebarRecentCommentSelect
}>
export interface PublicCommentListItem {
  authorName: string
  content: string
  createdAt: Date
  id: string
  post: { slug: string; title: string }
}
export interface PublicCategoryListItem {
  count: number
  name: string
  slug: string
}
export interface PublicArchiveListItem {
  count: number
  month: string
}
export interface AdminPostListItem {
  _count: { comments: number }
  author: { name: string; username: string }
  id: string
  featuredAt: Date | null
  publishedAt: Date | null
  removedAt: Date | null
  slug: string
  status: PostStatus
  title: string
  updatedAt: Date
}
export interface AdminCommentListItem {
  authorRole: Role | null
  authorName: string
  content: string
  createdAt: Date
  id: string
  post: { slug: string; title: string }
  status: CommentStatus
}

export interface WriterDashboardPostItem {
  _count: { comments: number }
  authorId: string
  coAuthors: { status: CoAuthorStatus; userId: string }[]
  id: string
  publishedAt: Date | null
  slug: string
  status: PostStatus
  title: string
  updatedAt: Date
}

export interface WriterEventItem {
  _count: { rooms: number }
  finalPost: { slug: string; status: PostStatus } | null
  id: string
  rooms: { id: string; status: AwardEventRoomStatus }[]
  status: AwardEventStatus
  title: string
}

type DbCount = bigint | number | null | undefined

interface AdminDashboardStatsRow {
  activeSubscribers: DbCount
  approvedComments: DbCount
  archivedPosts?: DbCount
  draftPosts: DbCount
  publishedPosts: DbCount
  removedPosts?: DbCount
  writers: DbCount
}

interface AdminPostRow {
  authorName: string | null
  authorUsername: string | null
  commentCount: DbCount
  id: string | null
  featuredAt: Date | null
  publishedAt: Date | null
  removedAt: Date | null
  slug: string | null
  status: string | null
  title: string | null
  totalCount: DbCount
  updatedAt: Date | null
}

interface AdminCommentRow {
  authorName: string | null
  authorRole: string | null
  content: string | null
  createdAt: Date | null
  id: string | null
  postSlug: string | null
  postTitle: string | null
  status: string | null
  totalCount: DbCount
}

interface AdminCommentCountsRow {
  approvedComments: DbCount
  spamComments: DbCount
}

interface PublicArchiveRow {
  count: DbCount
  month: string | null
}

interface PublishedPostListRow {
  author: PublishedPostListItem["author"] | null
  category: PublishedPostListItem["category"] | null
  coAuthors: PublishedPostListItem["coAuthors"]
  commentCount: DbCount
  coverAlt: string | null
  coverUrl: string | null
  eventIntro: unknown
  eventIntroText: string | null
  excerpt: string | null
  featuredAt: Date | null
  publishedAt: Date | null
  slug: string | null
  tags: PublishedPostListItem["tags"]
  title: string | null
  totalCount: DbCount
}

interface WriterDashboardPostRow {
  authorId: string | null
  coAuthors: WriterDashboardPostItem["coAuthors"]
  commentCount: DbCount
  id: string | null
  publishedAt: Date | null
  slug: string | null
  status: string | null
  title: string | null
  updatedAt: Date | null
}

interface WriterEventRow {
  finalPost: WriterEventItem["finalPost"]
  id: string | null
  roomCount: DbCount
  rooms: { id: string; status: string }[]
  status: string | null
  title: string | null
}

interface ContributorPostCountRow {
  postCount: DbCount
  writerId: string | null
}

function countToNumber(value: DbCount) {
  if (typeof value === "bigint") {
    return Number(value)
  }

  if (typeof value === "number") {
    return value
  }

  return 0
}

function parsePostStatus(value: string | null): PostStatus {
  if (
    value === "DRAFT" ||
    value === "PUBLISHED" ||
    value === "ARCHIVED" ||
    value === "REMOVED"
  ) {
    return value
  }

  throw new Error(`Unexpected post status: ${String(value)}`)
}

function parseCommentStatus(value: string | null): CommentStatus {
  if (value === "APPROVED" || value === "SPAM") {
    return value
  }

  throw new Error(`Unexpected comment status: ${String(value)}`)
}

function parseRole(value: string | null): Role | null {
  if (value === null) return null

  if (value === "ADMIN" || value === "WRITER" || value === "REVOKED") {
    return value
  }

  throw new Error(`Unexpected role: ${String(value)}`)
}

function parseAwardEventStatus(value: string | null): AwardEventStatus {
  if (value === "OPEN" || value === "CLOSED") {
    return value
  }

  throw new Error(`Unexpected award event status: ${String(value)}`)
}

function parseAwardEventRoomStatus(value: string): AwardEventRoomStatus {
  if (value === "DRAFT" || value === "SUBMITTED") {
    return value
  }

  throw new Error(`Unexpected award event room status: ${String(value)}`)
}

function getPublishedPostOrderSql(sort: PostListSort) {
  if (sort === "oldest") {
    return Prisma.sql`ORDER BY p."publishedAt" ASC NULLS LAST, p."updatedAt" ASC`
  }

  if (sort === "comments") {
    return Prisma.sql`ORDER BY "commentCount" DESC, p."publishedAt" DESC NULLS LAST`
  }

  return Prisma.sql`ORDER BY p."publishedAt" DESC NULLS LAST, p."updatedAt" DESC`
}

function getRichTextPlainText(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    return ""
  }

  const node = value as Record<string, unknown>
  const parts: string[] = []

  if (typeof node.text === "string") {
    parts.push(node.text)
  }

  if (Array.isArray(node.content)) {
    parts.push(...node.content.map(getRichTextPlainText))
  }

  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
}

function resolvePublishedPostExcerpt(row: PublishedPostListRow) {
  return (
    getRichTextPlainText(row.eventIntro) ||
    row.eventIntroText ||
    row.excerpt
  )
}

async function getPublishedPostListBySql(
  where: Prisma.Sql,
  page: number,
  pageSize: number,
  sort: PostListSort = "latest",
  orderOverride?: Prisma.Sql,
) {
  const offset = (page - 1) * pageSize
  const orderBy = orderOverride ?? getPublishedPostOrderSql(sort)
  const rows =
    sort === "comments"
      ? await prisma.$queryRaw<PublishedPostListRow[]>`
          WITH filtered_posts AS (
            SELECT
              p.id,
              p."authorId",
              p."categoryId",
              p."coverAlt",
              p."coverUrl",
              final_event.intro AS "eventIntro",
              final_event."introText" AS "eventIntroText",
              p.excerpt,
              p."featuredAt",
              p."publishedAt",
              p.slug,
              p.title,
              p."updatedAt",
              COALESCE(comment_counts.count, 0) AS "commentCount"
            FROM posts p
            LEFT JOIN award_events final_event
              ON final_event."finalPostId" = p.id
            LEFT JOIN LATERAL (
              SELECT COUNT(*)::int AS count
              FROM comments c
              WHERE c."postId" = p.id
            ) comment_counts ON TRUE
            WHERE ${where}
          ),
          counted AS (
            SELECT COUNT(*) AS "totalCount" FROM filtered_posts
          ),
          paged AS (
            SELECT *
            FROM filtered_posts p
            ${orderBy}
            LIMIT ${pageSize} OFFSET ${offset}
          )
          SELECT
            json_build_object(
              'avatarUrl', author."avatarUrl",
              'name', author.name,
              'username', author.username
            ) AS author,
            CASE
              WHEN category.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', category.id,
                'name', category.name,
                'slug', category.slug
              )
            END AS category,
            COALESCE(co_authors.items, '[]'::json) AS "coAuthors",
            p."commentCount",
            p."coverAlt",
            p."coverUrl",
            p."eventIntro",
            p."eventIntroText",
            p.excerpt,
            p."featuredAt",
            p."publishedAt",
            p.slug,
            COALESCE(tags.items, '[]'::json) AS tags,
            p.title,
            counted."totalCount"
          FROM counted
          LEFT JOIN paged p ON TRUE
          LEFT JOIN users author ON author.id = p."authorId"
          LEFT JOIN categories category ON category.id = p."categoryId"
          LEFT JOIN LATERAL (
            SELECT json_agg(
              json_build_object(
                'user', json_build_object(
                  'avatarUrl', credited_author."avatarUrl",
                  'name', credited_author.name,
                  'username', credited_author.username
                )
              )
              ORDER BY credited_author."creditOrder" ASC, credited_author.name ASC
            ) AS items
            FROM (
              SELECT
                credited_user."avatarUrl",
                MIN(credit."creditOrder") AS "creditOrder",
                credited_user.id,
                credited_user.name,
                credited_user.username
              FROM (
                SELECT pa."userId", pa.order AS "creditOrder"
                FROM post_authors pa
                WHERE pa."postId" = p.id
                  AND pa.status = 'ACCEPTED'

                UNION ALL

                SELECT event_room."writerId", event_room.order AS "creditOrder"
                FROM award_events event
                JOIN award_event_rooms event_room
                  ON event_room."eventId" = event.id
                WHERE event."finalPostId" = p.id
                  AND event_room.status = 'SUBMITTED'
                  AND event_room."excludedAt" IS NULL
              ) credit
              JOIN users credited_user ON credited_user.id = credit."userId"
              WHERE credited_user.id <> p."authorId"
              GROUP BY
                credited_user.id,
                credited_user."avatarUrl",
                credited_user.name,
                credited_user.username
            ) credited_author
          ) co_authors ON TRUE
          LEFT JOIN LATERAL (
            SELECT json_agg(
              json_build_object(
                'tag', json_build_object(
                  'id', t.id,
                  'name', t.name,
                  'slug', t.slug
                )
              )
              ORDER BY t.name ASC
            ) AS items
            FROM post_tags pt
            JOIN tags t ON t.id = pt."tagId"
            WHERE pt."postId" = p.id
          ) tags ON TRUE
          ${orderBy}
        `
      : await prisma.$queryRaw<PublishedPostListRow[]>`
          WITH filtered_posts AS (
            SELECT
              p.id,
              p."authorId",
              p."categoryId",
              p."coverAlt",
              p."coverUrl",
              final_event.intro AS "eventIntro",
              final_event."introText" AS "eventIntroText",
              p.excerpt,
              p."featuredAt",
              p."publishedAt",
              p.slug,
              p.title,
              p."updatedAt"
            FROM posts p
            LEFT JOIN award_events final_event
              ON final_event."finalPostId" = p.id
            WHERE ${where}
          ),
          counted AS (
            SELECT COUNT(*) AS "totalCount" FROM filtered_posts
          ),
          paged AS (
            SELECT *
            FROM filtered_posts p
            ${orderBy}
            LIMIT ${pageSize} OFFSET ${offset}
          )
          SELECT
            json_build_object(
              'avatarUrl', author."avatarUrl",
              'name', author.name,
              'username', author.username
            ) AS author,
            CASE
              WHEN category.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', category.id,
                'name', category.name,
                'slug', category.slug
              )
            END AS category,
            COALESCE(co_authors.items, '[]'::json) AS "coAuthors",
            COALESCE(comment_counts.count, 0) AS "commentCount",
            p."coverAlt",
            p."coverUrl",
            p."eventIntro",
            p."eventIntroText",
            p.excerpt,
            p."featuredAt",
            p."publishedAt",
            p.slug,
            COALESCE(tags.items, '[]'::json) AS tags,
            p.title,
            counted."totalCount"
          FROM counted
          LEFT JOIN paged p ON TRUE
          LEFT JOIN users author ON author.id = p."authorId"
          LEFT JOIN categories category ON category.id = p."categoryId"
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS count
            FROM comments c
            WHERE c."postId" = p.id
          ) comment_counts ON TRUE
          LEFT JOIN LATERAL (
            SELECT json_agg(
              json_build_object(
                'user', json_build_object(
                  'avatarUrl', credited_author."avatarUrl",
                  'name', credited_author.name,
                  'username', credited_author.username
                )
              )
              ORDER BY credited_author."creditOrder" ASC, credited_author.name ASC
            ) AS items
            FROM (
              SELECT
                credited_user."avatarUrl",
                MIN(credit."creditOrder") AS "creditOrder",
                credited_user.id,
                credited_user.name,
                credited_user.username
              FROM (
                SELECT pa."userId", pa.order AS "creditOrder"
                FROM post_authors pa
                WHERE pa."postId" = p.id
                  AND pa.status = 'ACCEPTED'

                UNION ALL

                SELECT event_room."writerId", event_room.order AS "creditOrder"
                FROM award_events event
                JOIN award_event_rooms event_room
                  ON event_room."eventId" = event.id
                WHERE event."finalPostId" = p.id
                  AND event_room.status = 'SUBMITTED'
                  AND event_room."excludedAt" IS NULL
              ) credit
              JOIN users credited_user ON credited_user.id = credit."userId"
              WHERE credited_user.id <> p."authorId"
              GROUP BY
                credited_user.id,
                credited_user."avatarUrl",
                credited_user.name,
                credited_user.username
            ) credited_author
          ) co_authors ON TRUE
          LEFT JOIN LATERAL (
            SELECT json_agg(
              json_build_object(
                'tag', json_build_object(
                  'id', t.id,
                  'name', t.name,
                  'slug', t.slug
                )
              )
              ORDER BY t.name ASC
            ) AS items
            FROM post_tags pt
            JOIN tags t ON t.id = pt."tagId"
            WHERE pt."postId" = p.id
          ) tags ON TRUE
          ${orderBy}
        `
  const posts: PublishedPostListItem[] = rows
    .filter(
      (row): row is PublishedPostListRow & {
        author: PublishedPostListItem["author"]
        slug: string
        title: string
      } => row.author !== null && row.slug !== null && row.title !== null,
    )
    .map((row) => ({
      _count: { comments: countToNumber(row.commentCount) },
      author: row.author,
      category: row.category,
      coAuthors: row.coAuthors,
      coverAlt: row.coverAlt,
      coverUrl: row.coverUrl,
      excerpt: resolvePublishedPostExcerpt(row),
      featuredAt: row.featuredAt,
      publishedAt: row.publishedAt,
      slug: row.slug,
      tags: row.tags,
      title: row.title,
    }))

  return { posts, total: countToNumber(rows[0]?.totalCount) }
}

function getArchiveMonthRange(archiveMonth?: string) {
  if (!archiveMonth || !/^\d{4}-\d{2}$/.test(archiveMonth)) {
    return null
  }

  const [yearPart, monthPart] = archiveMonth.split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))

  return { end, start }
}

export const getCachedPublishedPosts = unstable_cache(
  async (
    page: number,
    pageSize: number,
    sort: PostListSort = "latest",
    archiveMonth?: string,
  ) => {
    const archiveRange = getArchiveMonthRange(archiveMonth)
    return getPublishedPostListBySql(
      Prisma.sql`
        p.status = 'PUBLISHED'
        ${archiveRange
          ? Prisma.sql`AND p."publishedAt" >= ${archiveRange.start} AND p."publishedAt" < ${archiveRange.end}`
          : Prisma.empty}
      `,
      page,
      pageSize,
      sort,
    )
  },
  ["published-posts-with-event-contributors"],
  { revalidate: 300, tags: ["posts"] },
)

export const getCachedHomeCarouselPosts = unstable_cache(
  async () => {
    const featured = await getPublishedPostListBySql(
      Prisma.sql`
        p.status = 'PUBLISHED'
        AND p."featuredAt" IS NOT NULL
      `,
      1,
      10,
      "latest",
      Prisma.sql`ORDER BY p."featuredAt" DESC NULLS LAST, p."publishedAt" DESC NULLS LAST, p."updatedAt" DESC`,
    )
    const slotsRemaining = Math.max(10 - featured.posts.length, 0)

    if (slotsRemaining === 0) {
      return featured.posts.slice(0, 10)
    }

    const latest = await getCachedPublishedPosts(1, 10, "latest")
    const seenSlugs = new Set(featured.posts.map((post) => post.slug))
    const fallbackPosts = latest.posts.filter((post) => !seenSlugs.has(post.slug))

    return [...featured.posts, ...fallbackPosts].slice(0, 10)
  },
  ["home-carousel-posts-with-event-contributors"],
  { revalidate: 300, tags: ["posts"] },
)

export const getCachedSidebarData = unstable_cache(
  async () => {
    const sidebarLimit = 5
    const lookaheadLimit = sidebarLimit + 1
    const [categories, recentPosts, recentComments, archiveRows] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: sidebarCategorySelect,
        take: lookaheadLimit,
        where: { posts: { some: { status: "PUBLISHED" } } },
      }),
      prisma.post.findMany({
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        select: recentPostSelect,
        take: sidebarLimit,
        where: { status: "PUBLISHED" },
      }),
      prisma.comment.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: sidebarRecentCommentSelect,
        take: lookaheadLimit,
        where: {
          post: { status: "PUBLISHED" },
          status: "APPROVED",
        },
      }),
      prisma.$queryRaw<SidebarArchiveRow[]>`
        SELECT
          to_char(date_trunc('month', "publishedAt"), 'YYYY-MM') AS month,
          COUNT(*) AS count
        FROM posts
        WHERE status = 'PUBLISHED'
          AND "publishedAt" IS NOT NULL
        GROUP BY date_trunc('month', "publishedAt")
        ORDER BY date_trunc('month', "publishedAt") DESC
        LIMIT ${lookaheadLimit}
      `,
    ])

    const archives = archiveRows.slice(0, sidebarLimit).map((archive) => ({
      count: Number(archive.count),
      month: archive.month,
    }))

    return {
      archives,
      categories: categories.slice(0, sidebarLimit),
      hasMore: {
        archives: archiveRows.length > sidebarLimit,
        categories: categories.length > sidebarLimit,
        recentComments: recentComments.length > sidebarLimit,
      },
      recentComments: recentComments.slice(0, sidebarLimit),
      recentPosts,
    }
  },
  ["sidebar-data"],
  { revalidate: 300, tags: ["posts", "categories", "comments"] },
)

export const getCachedCommandCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: commandCategorySelect,
      where: { posts: { some: { status: "PUBLISHED" } } },
    }),
  ["command-categories"],
  { revalidate: 300, tags: ["categories", "posts"] },
)

export async function getCachedPublishedPost(slug: string) {
  return unstable_cache(
    async () =>
      prisma.post.findUnique({
        select: publishedPostDetailSelect,
        where: { slug, status: "PUBLISHED" },
      }),
    ["published-post", slug],
    {
      revalidate: 300,
      tags: ["posts", "users", getPostDetailCacheTag(slug)],
    },
  )()
}

export const getCachedContributors = unstable_cache(
  async () => {
    const [contributors, postCounts] = await Promise.all([
      prisma.user.findMany({
        orderBy: { name: "asc" },
        select: contributorSelect,
        where: { role: { in: ["ADMIN", "WRITER"] } },
      }),
      prisma.$queryRaw<ContributorPostCountRow[]>`
        SELECT
          credited_posts."writerId",
          COUNT(DISTINCT credited_posts."postId") AS "postCount"
        FROM (
          SELECT p."authorId" AS "writerId", p.id AS "postId"
          FROM posts p
          WHERE p.status = 'PUBLISHED'

          UNION

          SELECT post_author."userId" AS "writerId", p.id AS "postId"
          FROM post_authors post_author
          JOIN posts p ON p.id = post_author."postId"
          WHERE p.status = 'PUBLISHED'
            AND post_author.status = 'ACCEPTED'

          UNION

          SELECT event_room."writerId", event."finalPostId" AS "postId"
          FROM award_event_rooms event_room
          JOIN award_events event ON event.id = event_room."eventId"
          JOIN posts final_post ON final_post.id = event."finalPostId"
          WHERE event_room.status = 'SUBMITTED'
            AND event_room."excludedAt" IS NULL
            AND final_post.status = 'PUBLISHED'
        ) credited_posts
        GROUP BY credited_posts."writerId"
      `,
    ])
    const postCountByWriter = new Map(
      postCounts.flatMap((row) =>
        row.writerId ? [[row.writerId, countToNumber(row.postCount)] as const] : [],
      ),
    )

    return contributors.map(({ id, ...contributor }) => ({
      ...contributor,
      _count: {
        posts: postCountByWriter.get(id) ?? 0,
      },
    }))
  },
  ["contributors-with-event-post-counts"],
  { revalidate: 300, tags: ["posts", "users"] },
)

export const getCachedSitePage = unstable_cache(
  async (slug: string) =>
    prisma.sitePage.findUnique({
      select: sitePageSelect,
      where: { slug },
    }),
  ["site-page"],
  { revalidate: 300, tags: [SITE_PAGES_CACHE_TAG] },
)

export const getCachedSearchTaxonomy = unstable_cache(
  async () => {
    const [categories, tags, archiveRows] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: searchCategoryWithCountSelect,
        where: { posts: { some: { status: "PUBLISHED" } } },
      }),
      prisma.tag.findMany({
        orderBy: { name: "asc" },
        select: searchTagSelect,
        where: { posts: { some: { post: { status: "PUBLISHED" } } } },
      }),
      prisma.$queryRaw<SidebarArchiveRow[]>`
        SELECT
          to_char(date_trunc('month', "publishedAt"), 'YYYY-MM') AS month,
          COUNT(*) AS count
        FROM posts
        WHERE status = 'PUBLISHED'
          AND "publishedAt" IS NOT NULL
        GROUP BY date_trunc('month', "publishedAt")
        ORDER BY date_trunc('month', "publishedAt") DESC
      `,
    ])

    return {
      archives: archiveRows.map((archive) => ({
        count: Number(archive.count),
        month: archive.month,
      })),
      categories: categories.map((category) => ({
        count: category._count.posts,
        name: category.name,
        slug: category.slug,
      })),
      tags: tags.map((tag) => ({
        count: tag._count.posts,
        name: tag.name,
        slug: tag.slug,
      })),
    }
  },
  ["search-taxonomy"],
  { revalidate: 300, tags: ["categories", "tags", "posts"] },
)

export const getCachedPublicCategories = unstable_cache(
  async (): Promise<PublicCategoryListItem[]> => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: searchCategoryWithCountSelect,
      where: { posts: { some: { status: "PUBLISHED" } } },
    })

    return categories.map((category) => ({
      count: category._count.posts,
      name: category.name,
      slug: category.slug,
    }))
  },
  ["public-categories"],
  { revalidate: 300, tags: ["categories", "posts"] },
)

export const getCachedPublicArchives = unstable_cache(
  async (): Promise<PublicArchiveListItem[]> => {
    const archiveRows = await prisma.$queryRaw<PublicArchiveRow[]>`
      SELECT
        to_char(date_trunc('month', "publishedAt"), 'YYYY-MM') AS month,
        COUNT(*) AS count
      FROM posts
      WHERE status = 'PUBLISHED'
        AND "publishedAt" IS NOT NULL
      GROUP BY date_trunc('month', "publishedAt")
      ORDER BY date_trunc('month', "publishedAt") DESC
    `

    return archiveRows
      .filter((archive): archive is PublicArchiveRow & { month: string } =>
        archive.month !== null,
      )
      .map((archive) => ({
        count: countToNumber(archive.count),
        month: archive.month,
      }))
  },
  ["public-archives"],
  { revalidate: 300, tags: ["posts"] },
)

export const getCachedPublicComments = unstable_cache(
  async (page: number, pageSize: number) => {
    const offset = (page - 1) * pageSize
    const [comments, total] = await prisma.$transaction([
      prisma.comment.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: sidebarRecentCommentSelect,
        skip: offset,
        take: pageSize,
        where: {
          post: { status: "PUBLISHED" },
          status: "APPROVED",
        },
      }),
      prisma.comment.count({
        where: {
          post: { status: "PUBLISHED" },
          status: "APPROVED",
        },
      }),
    ])

    return { comments, total }
  },
  ["public-comments"],
  { revalidate: 300, tags: ["posts", "comments"] },
)

export const getCachedEditorReferenceData = unstable_cache(
  async () => {
    const [categories, writers] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: editorCategorySelect,
      }),
      prisma.user.findMany({
        orderBy: { name: "asc" },
        select: editorWriterSelect,
        where: { role: { in: ["ADMIN", "WRITER"] } },
      }),
    ])

    return { categories, writers }
  },
  ["editor-reference-data"],
  { revalidate: 300, tags: ["categories", "users"] },
)

export const getCachedWriterDashboardPosts = unstable_cache(
  async (userId: string) => {
    const rows = await prisma.$queryRaw<WriterDashboardPostRow[]>`
      SELECT
        p.id,
        p."authorId",
        p."publishedAt",
        p.slug,
        p.status::text AS status,
        p.title,
        p."updatedAt",
        COALESCE(comment_counts.count, 0) AS "commentCount",
        COALESCE(co_authors.items, '[]'::json) AS "coAuthors"
      FROM posts p
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS count
        FROM comments c
        WHERE c."postId" = p.id
      ) comment_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'status', pa.status::text,
            'userId', pa."userId"
          )
          ORDER BY pa.order ASC
        ) AS items
        FROM post_authors pa
        WHERE pa."postId" = p.id
      ) co_authors ON TRUE
      WHERE p.status NOT IN ('ARCHIVED', 'REMOVED')
        AND NOT EXISTS (
          SELECT 1
          FROM award_events event
          WHERE event."finalPostId" = p.id
        )
        AND (
          p."authorId" = ${userId}
          OR EXISTS (
            SELECT 1
            FROM post_authors invited
            WHERE invited."postId" = p.id
              AND invited."userId" = ${userId}
              AND invited.status IN ('ACCEPTED', 'PENDING')
          )
        )
      ORDER BY p."updatedAt" DESC
    `

    return rows
      .filter(
        (row): row is WriterDashboardPostRow & {
          authorId: string
          id: string
          slug: string
          status: string
          title: string
          updatedAt: Date
        } =>
          row.authorId !== null &&
          row.id !== null &&
          row.slug !== null &&
          row.status !== null &&
          row.title !== null &&
          row.updatedAt !== null,
      )
      .map((row): WriterDashboardPostItem => ({
        _count: { comments: countToNumber(row.commentCount) },
        authorId: row.authorId,
        coAuthors: row.coAuthors,
        id: row.id,
        publishedAt: row.publishedAt,
        slug: row.slug,
        status: parsePostStatus(row.status),
        title: row.title,
        updatedAt: row.updatedAt,
      }))
  },
  ["writer-dashboard-posts"],
  { revalidate: 60, tags: ["posts"] },
)

export const getCachedProfileUser = unstable_cache(
  async (userId: string) =>
    prisma.user.findUnique({
      select: profileUserSelect,
      where: { id: userId },
    }),
  ["profile-user"],
  { revalidate: 300, tags: ["users"] },
)

export const getCachedAdminDashboardStats = unstable_cache(
  async () => {
    const [stats] = await prisma.$queryRaw<AdminDashboardStatsRow[]>`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE status = 'PUBLISHED') AS "publishedPosts",
        (SELECT COUNT(*) FROM posts WHERE status = 'DRAFT') AS "draftPosts",
        (SELECT COUNT(*) FROM posts WHERE status = 'ARCHIVED') AS "archivedPosts",
        (SELECT COUNT(*) FROM posts WHERE status = 'REMOVED') AS "removedPosts",
        (SELECT COUNT(*) FROM users WHERE role::text = 'WRITER') AS "writers",
        (SELECT COUNT(*) FROM comments WHERE status = 'APPROVED') AS "approvedComments",
        (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'ACTIVE') AS "activeSubscribers"
    `

    return {
      activeSubscribers: countToNumber(stats?.activeSubscribers),
      approvedComments: countToNumber(stats?.approvedComments),
      archivedPosts: countToNumber(stats?.archivedPosts),
      draftPosts: countToNumber(stats?.draftPosts),
      publishedPosts: countToNumber(stats?.publishedPosts),
      removedPosts: countToNumber(stats?.removedPosts),
      writers: countToNumber(stats?.writers),
    }
  },
  ["admin-dashboard-stats"],
  { revalidate: 60, tags: ["posts", "comments", "users", "newsletter"] },
)

export const getCachedAdminPosts = unstable_cache(
  async (
    page: number,
    status: PostStatus | undefined,
    pageSize: number,
    sort: PostListSort = "latest",
    searchQuery?: string,
  ) => {
    const offset = (page - 1) * pageSize

    // Build where clause
    const conditions = []
    if (status) {
      conditions.push(Prisma.sql`p.status = ${status}::"PostStatus"`)
    }
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`
      conditions.push(Prisma.sql`p.title ILIKE ${searchPattern}`)
    }

    const statusFilter = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty

    const chronologicalOrderBy = sort === "oldest"
      ? Prisma.sql`ORDER BY "publishedAt" ASC NULLS LAST, "updatedAt" ASC`
      : Prisma.sql`ORDER BY "publishedAt" DESC NULLS FIRST, "updatedAt" DESC`
    const commentsOrderBy = Prisma.sql`ORDER BY "commentCount" DESC, "publishedAt" DESC NULLS LAST`
    const rows = sort === "comments"
      ? await prisma.$queryRaw<AdminPostRow[]>`
      WITH filtered AS (
        SELECT
          p.id,
          p.title,
          p.slug,
          p.status::text AS status,
          p."featuredAt",
          p."publishedAt",
          p."removedAt",
          p."updatedAt",
          u.name AS "authorName",
          u.username AS "authorUsername",
          COUNT(c.id) AS "commentCount"
        FROM posts p
        JOIN users u ON u.id = p."authorId"
        LEFT JOIN comments c ON c."postId" = p.id
        ${statusFilter}
        GROUP BY p.id, u.name, u.username
      ),
      counted AS (
        SELECT COUNT(*) AS "totalCount" FROM filtered
      ),
      paged AS (
        SELECT *
        FROM filtered
        ${commentsOrderBy}
        LIMIT ${pageSize} OFFSET ${offset}
      )
      SELECT counted."totalCount", paged.*
      FROM counted
      LEFT JOIN paged ON TRUE
    `
      : await prisma.$queryRaw<AdminPostRow[]>`
      WITH filtered AS (
        SELECT
          p.id,
          p.title,
          p.slug,
          p.status::text AS status,
          p."featuredAt",
          p."publishedAt",
          p."removedAt",
          p."updatedAt",
          u.name AS "authorName",
          u.username AS "authorUsername"
        FROM posts p
        JOIN users u ON u.id = p."authorId"
        ${statusFilter}
      ),
      counted AS (
        SELECT COUNT(*) AS "totalCount" FROM filtered
      ),
      paged AS (
        SELECT *
        FROM filtered
        ${chronologicalOrderBy}
        LIMIT ${pageSize} OFFSET ${offset}
      )
      SELECT
        counted."totalCount",
        p.*,
        COALESCE(comment_counts.count, 0) AS "commentCount"
      FROM counted
      LEFT JOIN paged p ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS count
        FROM comments c
        WHERE c."postId" = p.id
      ) comment_counts ON p.id IS NOT NULL
    `
    const posts: AdminPostListItem[] = []

    for (const row of rows) {
      if (
        row.id === null ||
        row.title === null ||
        row.slug === null ||
        row.status === null ||
        row.updatedAt === null ||
        row.authorName === null ||
        row.authorUsername === null
      ) {
        continue
      }

      posts.push({
        _count: { comments: countToNumber(row.commentCount) },
        author: { name: row.authorName, username: row.authorUsername },
        id: row.id,
        featuredAt: row.featuredAt,
        publishedAt: row.publishedAt,
        removedAt: row.removedAt,
        slug: row.slug,
        status: parsePostStatus(row.status),
        title: row.title,
        updatedAt: row.updatedAt,
      })
    }
    const total = countToNumber(rows[0]?.totalCount)

    return { posts, total }
  },
  ["admin-posts"],
  { revalidate: 60, tags: ["posts"] },
)

export const getCachedAdminComments = unstable_cache(
  async (page: number, status: CommentStatus, pageSize: number) => {
    const offset = (page - 1) * pageSize
    const rows = await prisma.$queryRaw<AdminCommentRow[]>`
      WITH filtered AS (
        SELECT
          c.id,
          c."authorName",
          author.role::text AS "authorRole",
          c.content,
          c."createdAt",
          c.status::text AS status,
          p.slug AS "postSlug",
          p.title AS "postTitle"
        FROM comments c
        JOIN posts p ON p.id = c."postId"
        LEFT JOIN users author ON author.id = c."authorId"
        WHERE c.status = ${status}::"CommentStatus"
      ),
      counted AS (
        SELECT COUNT(*) AS "totalCount" FROM filtered
      ),
      paged AS (
        SELECT *
        FROM filtered
        ORDER BY "createdAt" DESC
        LIMIT ${pageSize} OFFSET ${offset}
      )
      SELECT counted."totalCount", paged.*
      FROM counted
      LEFT JOIN paged ON TRUE
    `
    const comments: AdminCommentListItem[] = []

    for (const row of rows) {
      if (
        row.id === null ||
        row.authorName === null ||
        row.content === null ||
        row.createdAt === null ||
        row.status === null ||
        row.postSlug === null ||
        row.postTitle === null
      ) {
        continue
      }

      comments.push({
        authorRole: parseRole(row.authorRole),
        authorName: row.authorName,
        content: row.content,
        createdAt: row.createdAt,
        id: row.id,
        post: { slug: row.postSlug, title: row.postTitle },
        status: parseCommentStatus(row.status),
      })
    }
    const total = countToNumber(rows[0]?.totalCount)

    return { comments, total }
  },
  ["admin-comments"],
  { revalidate: 60, tags: ["comments"] },
)

export const getCachedAdminCommentCounts = unstable_cache(
  async () => {
    const [counts] = await prisma.$queryRaw<AdminCommentCountsRow[]>`
      SELECT
        (SELECT COUNT(*) FROM comments WHERE status = 'APPROVED') AS "approvedComments",
        (SELECT COUNT(*) FROM comments WHERE status = 'SPAM') AS "spamComments"
    `

    return {
      approvedComments: countToNumber(counts?.approvedComments),
      pendingComments: 0,
      spamComments: countToNumber(counts?.spamComments),
    }
  },
  ["admin-comment-counts"],
  { revalidate: 60, tags: ["comments"] },
)

export const getCachedAdminWritersData = unstable_cache(
  async () => {
    const [writers, pendingInvites] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: adminWriterSelect,
        where: { role: "WRITER" },
      }),
      prisma.invite.findMany({
        orderBy: { createdAt: "desc" },
        select: pendingInviteSelect,
        where: { expiresAt: { gt: new Date() }, status: "PENDING" },
      }),
    ])

    return { pendingInvites, writers }
  },
  ["admin-writers-data"],
  { revalidate: 60, tags: ["users", "invites"] },
)

export const getCachedAdminContentData = unstable_cache(
  async () => {
    const [categories, tags] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: adminContentCategorySelect,
      }),
      prisma.tag.findMany({
        orderBy: { name: "asc" },
        select: adminContentTagSelect,
      }),
    ])

    return { categories, tags }
  },
  ["admin-content-data"],
  { revalidate: 60, tags: ["categories", "tags", "posts"] },
)

export const getCachedAdminNewsletterData = unstable_cache(
  async () => {
    const [
      activeCount,
      deliveredTotals,
      recentBroadcasts,
      recentPosts,
      totalBroadcasts,
    ] = await Promise.all([
      prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      prisma.newsletterBroadcast.aggregate({ _sum: { sentCount: true } }),
      prisma.newsletterBroadcast.findMany({
        orderBy: { createdAt: "desc" },
        select: adminNewsletterBroadcastSelect,
        take: 10,
      }),
      prisma.post.findMany({
        orderBy: { publishedAt: "desc" },
        select: newsletterRecentPostSelect,
        take: 10,
        where: { status: "PUBLISHED" },
      }),
      prisma.newsletterBroadcast.count(),
    ])

    return {
      activeCount,
      deliveredCount: deliveredTotals._sum.sentCount ?? 0,
      recentBroadcasts,
      recentPosts,
      totalBroadcasts,
    }
  },
  ["admin-newsletter-data"],
  { revalidate: 60, tags: ["newsletter", "posts"] },
)

export const getCachedAdminAnalyticsData = unstable_cache(
  async (startAt: number, endAt: number) => {
    const [dailyPageviews, stats, topPages] = await Promise.all([
      getInternalDailyPageviews(startAt, endAt),
      getInternalAnalyticsStats(startAt, endAt),
      getInternalTopPages(startAt, endAt, 5),
    ])

    return { dailyPageviews, stats, topPages }
  },
  ["admin-analytics-data"],
  { revalidate: 60, tags: ["analytics"] },
)

export const getCachedAdminEventsData = unstable_cache(
  async () => {
    const [events, categories, tags] = await Promise.all([
      prisma.awardEvent.findMany({
        orderBy: { createdAt: "desc" },
        select: awardEventListSelect,
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: adminAwardEventCategorySelect,
      }),
      prisma.tag.findMany({
        orderBy: { name: "asc" },
        select: adminAwardEventTagSelect,
      }),
    ])

    return { categories, events, tags }
  },
  ["admin-events-data"],
  { revalidate: 60, tags: ["award-events", "categories", "tags"] },
)

export const getCachedAdminEventOptions = unstable_cache(
  async () => {
    const [categories, tags] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: adminAwardEventCategorySelect,
      }),
      prisma.tag.findMany({
        orderBy: { name: "asc" },
        select: adminAwardEventTagSelect,
      }),
    ])

    return { categories, tags }
  },
  ["admin-event-options"],
  { revalidate: 60, tags: ["categories", "tags"] },
)

export const getCachedWriterEvents = unstable_cache(
  async (userId: string) => {
    const rows = await prisma.$queryRaw<WriterEventRow[]>`
      SELECT
        e.id,
        CASE
          WHEN final_post.slug IS NULL THEN NULL
          ELSE json_build_object('slug', final_post.slug, 'status', final_post.status::text)
        END AS "finalPost",
        COALESCE(room_counts.count, 0) AS "roomCount",
        COALESCE(writer_rooms.items, '[]'::json) AS rooms,
        e.status::text AS status,
        e.title
      FROM award_events e
      LEFT JOIN posts final_post ON final_post.id = e."finalPostId"
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS count
        FROM award_event_rooms room_count
        WHERE room_count."eventId" = e.id
      ) room_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', room.id,
            'status', room.status::text
          )
          ORDER BY room."updatedAt" DESC
        ) AS items
        FROM award_event_rooms room
        WHERE room."eventId" = e.id
          AND room."writerId" = ${userId}
      ) writer_rooms ON TRUE
      WHERE e.status IN ('OPEN', 'CLOSED')
      ORDER BY e."createdAt" DESC
    `

    return rows
      .filter(
        (row): row is WriterEventRow & {
          id: string
          status: string
          title: string
        } => row.id !== null && row.status !== null && row.title !== null,
      )
      .map((row): WriterEventItem => ({
        _count: { rooms: countToNumber(row.roomCount) },
        finalPost: row.finalPost,
        id: row.id,
        rooms: row.rooms.map((room) => ({
          id: room.id,
          status: parseAwardEventRoomStatus(room.status),
        })),
        status: parseAwardEventStatus(row.status),
        title: row.title,
      }))
  },
  ["writer-events"],
  { revalidate: 60, tags: ["award-events"] },
)

export const getCachedAdminEventDetail = unstable_cache(
  async (id: string) =>
    prisma.awardEvent.findUnique({
      select: adminAwardEventDetailSelect,
      where: { id },
    }),
  ["admin-event-detail"],
  { revalidate: 60, tags: ["award-events"] },
)

export const getCachedCategoryBySlug = unstable_cache(
  async (slug: string) =>
    prisma.category.findUnique({
      select: publicCategorySelect,
      where: { slug },
    }),
  ["category-by-slug"],
  { revalidate: 300, tags: ["categories"] },
)

export const getCachedCategoryPosts = unstable_cache(
  async (
    categorySlug: string,
    page: number,
    pageSize: number,
    sort: PostListSort = "latest",
  ) =>
    getPublishedPostListBySql(
      Prisma.sql`
        p.status = 'PUBLISHED'
        AND EXISTS (
          SELECT 1
          FROM categories c
          WHERE c.id = p."categoryId"
            AND c.slug = ${categorySlug}
        )
      `,
      page,
      pageSize,
      sort,
    ),
  ["category-posts"],
  { revalidate: 300, tags: ["posts", "categories"] },
)

export const getCachedTagBySlug = unstable_cache(
  async (slug: string) =>
    prisma.tag.findUnique({
      select: publicTagSelect,
      where: { slug },
    }),
  ["tag-by-slug"],
  { revalidate: 300, tags: ["tags"] },
)

export const getCachedTagPosts = unstable_cache(
  async (
    tagSlug: string,
    page: number,
    pageSize: number,
    sort: PostListSort = "latest",
  ) =>
    getPublishedPostListBySql(
      Prisma.sql`
        p.status = 'PUBLISHED'
        AND EXISTS (
          SELECT 1
          FROM post_tags pt
          JOIN tags t ON t.id = pt."tagId"
          WHERE pt."postId" = p.id
            AND t.slug = ${tagSlug}
        )
      `,
      page,
      pageSize,
      sort,
    ),
  ["tag-posts"],
  { revalidate: 300, tags: ["posts", "tags"] },
)

export const getCachedAuthorByUsername = unstable_cache(
  async (username: string) =>
    prisma.user.findUnique({
      select: publicAuthorSelect,
      where: { username },
    }),
  ["author-by-username"],
  { revalidate: 300, tags: ["users"] },
)

export const getCachedAuthorPosts = unstable_cache(
  async (
    username: string,
    page: number,
    pageSize: number,
    sort: PostListSort = "latest",
  ) =>
    getPublishedPostListBySql(
      Prisma.sql`
        p.status = 'PUBLISHED'
        AND (
          EXISTS (
            SELECT 1
            FROM users u
            WHERE u.id = p."authorId"
              AND u.username = ${username}
          )
          OR EXISTS (
            SELECT 1
            FROM post_authors pa
            JOIN users co_author ON co_author.id = pa."userId"
            WHERE pa."postId" = p.id
              AND pa.status = 'ACCEPTED'
              AND co_author.username = ${username}
          )
          OR EXISTS (
            SELECT 1
            FROM award_events event
            JOIN award_event_rooms event_room
              ON event_room."eventId" = event.id
            JOIN users event_writer
              ON event_writer.id = event_room."writerId"
            WHERE event."finalPostId" = p.id
              AND event_room.status = 'SUBMITTED'
              AND event_room."excludedAt" IS NULL
              AND event_writer.username = ${username}
          )
        )
      `,
      page,
      pageSize,
      sort,
    ),
  ["author-posts-with-event-contributors"],
  { revalidate: 300, tags: ["posts", "users"] },
)

export const getCachedSearchResults = unstable_cache(
  async (
    searchQuery: PreparedSearchQuery,
    page: number,
    pageSize: number,
    filters: SearchFilters = { tagSlugs: [] },
  ) => {
    const offset = (page - 1) * pageSize
    const archiveRange = getArchiveMonthRange(filters.archive)
    const hasTextSearch = Boolean(searchQuery.normalizedQuery)
    const categoryCondition = filters.categorySlug
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM categories c
          WHERE c.id = p."categoryId" AND c.slug = ${filters.categorySlug}
        )`
      : Prisma.empty

    const tagCondition = filters.tagSlugs.length > 0
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM post_tags pt
          JOIN tags t ON t.id = pt."tagId"
          WHERE pt."postId" = p.id AND t.slug IN (${Prisma.join(filters.tagSlugs)})
        )`
      : Prisma.empty
    const archiveCondition = archiveRange
      ? Prisma.sql`AND p."publishedAt" >= ${archiveRange.start} AND p."publishedAt" < ${archiveRange.end}`
      : Prisma.empty
    const textMatchCondition = hasTextSearch
      ? Prisma.sql`AND (
          p.search_vector @@ si.web_query
          OR (si.prefix_query IS NOT NULL AND p.search_vector @@ si.prefix_query)
          OR (
            si.can_fuzzy
            AND (
              lower(public.search_unaccent(p.title)) % si.needle
              OR lower(public.search_unaccent(COALESCE(p.excerpt, ''))) % si.needle
              OR lower(public.search_unaccent(COALESCE(p."contentText", ''))) % si.needle
              OR word_similarity(si.needle, lower(public.search_unaccent(p.title))) >= 0.45
              OR word_similarity(si.needle, lower(public.search_unaccent(COALESCE(p.excerpt, '')))) >= 0.45
              OR word_similarity(si.needle, lower(public.search_unaccent(COALESCE(p."contentText", '')))) >= 0.55
            )
          )
        )`
      : Prisma.empty

    if (!hasTextSearch) {
      const [results, countResult] = await Promise.all([
        prisma.$queryRaw<SearchResult[]>`
          SELECT
            p.id,
            p.title,
            p.slug,
            p.excerpt,
            p."coverUrl",
            p."publishedAt",
            u.name AS "authorName",
            u.username AS "authorUsername",
            u."avatarUrl" AS "authorAvatarUrl",
            0 AS rank,
            NULL AS snippet
          FROM posts p
          JOIN users u ON u.id = p."authorId"
          WHERE
            p.status = 'PUBLISHED'
            ${categoryCondition}
            ${tagCondition}
            ${archiveCondition}
          ORDER BY p."publishedAt" DESC
          LIMIT ${pageSize}
          OFFSET ${offset}
        `,
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) AS count
          FROM posts p
          WHERE
            p.status = 'PUBLISHED'
            ${categoryCondition}
            ${tagCondition}
            ${archiveCondition}
        `,
      ])
      const total = Number(countResult[0]?.count ?? 0)

      return { results, total }
    }

    const [results, countResult] = await Promise.all([
      prisma.$queryRaw<SearchResult[]>`
        WITH search_input AS (
          SELECT
            ${hasTextSearch}::boolean AS has_text,
            CASE
              WHEN ${hasTextSearch} THEN websearch_to_tsquery('simple', ${searchQuery.normalizedQuery})
              ELSE NULL
            END AS web_query,
            CASE
              WHEN ${hasTextSearch} AND ${searchQuery.prefixTsQuery} <> '' THEN to_tsquery('simple', ${searchQuery.prefixTsQuery})
              ELSE NULL
            END AS prefix_query,
            ${searchQuery.normalizedQuery}::text AS needle,
            ${searchQuery.canUseFuzzy}::boolean AS can_fuzzy
        ),
        ranked AS (
          SELECT
            p.id,
            p.title,
            p.slug,
            p.excerpt,
            p."coverUrl",
            p."publishedAt",
            u.name AS "authorName",
            u.username AS "authorUsername",
            u."avatarUrl" AS "authorAvatarUrl",
            CASE
              WHEN si.web_query IS NULL THEN 0
              ELSE ts_rank_cd(p.search_vector, si.web_query)
            END AS full_text_rank,
            CASE
              WHEN si.prefix_query IS NULL THEN 0
              ELSE ts_rank_cd(p.search_vector, si.prefix_query)
            END AS prefix_rank,
            similarity(lower(public.search_unaccent(p.title)), si.needle) AS title_similarity,
            similarity(lower(public.search_unaccent(COALESCE(p.excerpt, ''))), si.needle) AS excerpt_similarity,
            similarity(lower(public.search_unaccent(COALESCE(p."contentText", ''))), si.needle) AS content_similarity,
            si.has_text AND lower(public.search_unaccent(p.title)) = si.needle AS exact_title_match,
            si.has_text AND lower(public.search_unaccent(p.title)) LIKE '%' || si.needle || '%' AS title_contains,
            si.has_text AND lower(public.search_unaccent(COALESCE(p.excerpt, ''))) LIKE '%' || si.needle || '%' AS excerpt_contains,
            si.has_text AND lower(public.search_unaccent(COALESCE(p."contentText", ''))) LIKE '%' || si.needle || '%' AS content_contains,
            CASE
              WHEN
                (
                  si.web_query IS NOT NULL
                  AND p.search_vector @@ si.web_query
                )
                OR (
                  si.prefix_query IS NOT NULL
                  AND p.search_vector @@ si.prefix_query
                )
              THEN ts_headline(
                'simple',
                COALESCE(p."contentText", ''),
                si.web_query,
                'MaxWords=34, MinWords=12, StartSel=<mark>, StopSel=</mark>, HighlightAll=false'
              )
              ELSE NULL
            END AS snippet
          FROM posts p
          JOIN users u ON u.id = p."authorId"
          CROSS JOIN search_input si
          WHERE
            p.status = 'PUBLISHED'
            ${textMatchCondition}
            ${categoryCondition}
            ${tagCondition}
            ${archiveCondition}
        )
        SELECT
          id,
          title,
          slug,
          excerpt,
          "coverUrl",
          "publishedAt",
          "authorName",
          "authorUsername",
          "authorAvatarUrl",
          (
            CASE WHEN exact_title_match THEN 6 ELSE 0 END
            + CASE WHEN title_contains THEN 4 ELSE 0 END
            + CASE WHEN excerpt_contains THEN 2 ELSE 0 END
            + CASE WHEN content_contains THEN 0.75 ELSE 0 END
            + full_text_rank * 3
            + prefix_rank * 2
            + title_similarity * 1.5
            + excerpt_similarity
            + content_similarity * 0.3
          ) AS rank,
          snippet
        FROM ranked
        ORDER BY
          rank DESC,
          "publishedAt" DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        WITH search_input AS (
          SELECT
            CASE
              WHEN ${hasTextSearch} THEN websearch_to_tsquery('simple', ${searchQuery.normalizedQuery})
              ELSE NULL
            END AS web_query,
            CASE
              WHEN ${hasTextSearch} AND ${searchQuery.prefixTsQuery} <> '' THEN to_tsquery('simple', ${searchQuery.prefixTsQuery})
              ELSE NULL
            END AS prefix_query,
            ${searchQuery.normalizedQuery}::text AS needle,
            ${searchQuery.canUseFuzzy}::boolean AS can_fuzzy
        )
        SELECT COUNT(*) AS count
        FROM posts p
        CROSS JOIN search_input si
        WHERE
          p.status = 'PUBLISHED'
          ${textMatchCondition}
          ${categoryCondition}
          ${tagCondition}
          ${archiveCondition}
      `,
    ])
    const total = Number(countResult[0]?.count ?? 0)

    return { results, total }
  },
  ["search-results"],
  { revalidate: 60, tags: ["posts"] },
)
export async function getHomePageData({
  archive,
  page,
  sort,
}: {
  archive?: string
  page: number
  sort: PostListSort
}) {
  const listDataPromise = getCachedPublishedPosts(page, 10, sort, archive)
  const sidebarDataPromise = getCachedSidebarData()
  const carouselPostsPromise = getCachedHomeCarouselPosts()

  const [listData, sidebarData, carouselPosts] = await Promise.all([
    listDataPromise,
    sidebarDataPromise,
    carouselPostsPromise,
  ])

  return { carouselPosts, listData, sidebarData }
}
