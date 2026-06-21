import { unstable_cache } from "next/cache"
import {
  Prisma,
  type AwardEventRoomStatus,
  type AwardEventStatus,
  type CoAuthorStatus,
  type CommentStatus,
  type PostStatus,
} from "@prisma/client"

import {
  adminAwardEventDetailSelect,
  awardEventListSelect,
} from "@/lib/awardEventService"
import {
  getInternalAnalyticsStats,
  getInternalTopPages,
} from "@/lib/internalAnalytics"
import type { PostListSort } from "@/lib/postListSort"
import { prisma } from "@/lib/prisma"
import type { SearchResult } from "@/lib/search"

const sidebarCategorySelect = {
  _count: {
    select: { posts: { where: { status: "PUBLISHED" } } },
  },
  children: {
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { posts: { where: { status: "PUBLISHED" } } },
      },
    },
  },
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

const recentPostSelect = {
  publishedAt: true,
  slug: true,
  title: true,
} satisfies Prisma.PostSelect

const commandCategorySelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

type SidebarArchiveRow = {
  count: bigint
  month: string
}

const contributorSelect = {
  _count: {
    select: { posts: { where: { status: "PUBLISHED" } } },
  },
  avatarUrl: true,
  bio: true,
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
  id: true,
  name: true,
  username: true,
  role: true,
} satisfies Prisma.UserSelect

const editorCategorySelect = {
  children: {
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  },
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
  avatarUrl: true,
  bio: true,
  email: true,
  name: true,
  username: true,
} satisfies Prisma.UserSelect

const adminWriterSelect = {
  _count: { select: { posts: true } },
  createdAt: true,
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

const adminAwardEventCategorySelect = {
  id: true,
  name: true,
} satisfies Prisma.CategorySelect

const adminAwardEventTagSelect = {
  id: true,
  name: true,
} satisfies Prisma.TagSelect

const adminContentCategorySelect = {
  _count: { select: { children: true, posts: true } },
  children: {
    orderBy: { name: "asc" },
    select: {
      _count: { select: { children: true, posts: true } },
      description: true,
      id: true,
      name: true,
      parentId: true,
      slug: true,
    },
  },
  description: true,
  id: true,
  name: true,
  parentId: true,
  slug: true,
} satisfies Prisma.CategorySelect

const adminContentTagSelect = {
  _count: { select: { posts: true } },
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.TagSelect

const adminDashboardRecentPostSelect = {
  author: { select: { name: true } },
  id: true,
  status: true,
  title: true,
  updatedAt: true,
} satisfies Prisma.PostSelect

const adminDashboardRecentCommentSelect = {
  authorName: true,
  content: true,
  createdAt: true,
  id: true,
  post: { select: { slug: true, title: true } },
} satisfies Prisma.CommentSelect

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
  id: true,
  publishedAt: true,
  slug: true,
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
export interface AdminPostListItem {
  _count: { comments: number }
  author: { name: string; username: string }
  id: string
  publishedAt: Date | null
  slug: string
  status: PostStatus
  title: string
  updatedAt: Date
}
export interface AdminCommentListItem {
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
  finalPost: { slug: string } | null
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
  writers: DbCount
}

interface AdminPostRow {
  authorName: string | null
  authorUsername: string | null
  commentCount: DbCount
  id: string | null
  publishedAt: Date | null
  slug: string | null
  status: string | null
  title: string | null
  totalCount: DbCount
  updatedAt: Date | null
}

interface AdminCommentRow {
  authorName: string | null
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

interface PublishedPostListRow {
  author: PublishedPostListItem["author"] | null
  category: PublishedPostListItem["category"] | null
  coAuthors: PublishedPostListItem["coAuthors"]
  commentCount: DbCount
  coverAlt: string | null
  coverUrl: string | null
  excerpt: string | null
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
  if (value === "DRAFT" || value === "PUBLISHED" || value === "ARCHIVED") {
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

function parseAwardEventStatus(value: string | null): AwardEventStatus {
  if (
    value === "DRAFT" ||
    value === "OPEN" ||
    value === "CLOSED" ||
    value === "PUBLISHED" ||
    value === "ARCHIVED"
  ) {
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

async function getPublishedPostListBySql(
  where: Prisma.Sql,
  page: number,
  pageSize: number,
  sort: PostListSort = "latest",
) {
  const offset = (page - 1) * pageSize
  const orderBy = getPublishedPostOrderSql(sort)
  const rows = await prisma.$queryRaw<PublishedPostListRow[]>`
    WITH filtered_posts AS (
      SELECT
        p.id,
        p."authorId",
        p."categoryId",
        p."coverAlt",
        p."coverUrl",
        p.excerpt,
        p."publishedAt",
        p.slug,
        p.title,
        p."updatedAt",
        COALESCE(comment_counts.count, 0) AS "commentCount"
      FROM posts p
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
      p.excerpt,
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
            'avatarUrl', co_author."avatarUrl",
            'name', co_author.name,
            'username', co_author.username
          )
        )
        ORDER BY pa.order ASC
      ) AS items
      FROM post_authors pa
      JOIN users co_author ON co_author.id = pa."userId"
      WHERE pa."postId" = p.id
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
      excerpt: row.excerpt,
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
        p.status::text = 'PUBLISHED'
        ${archiveRange
          ? Prisma.sql`AND p."publishedAt" >= ${archiveRange.start} AND p."publishedAt" < ${archiveRange.end}`
          : Prisma.empty}
      `,
      page,
      pageSize,
      sort,
    )
  },
  ["published-posts"],
  { revalidate: 300, tags: ["posts"] },
)

export const getCachedSidebarData = unstable_cache(
  async () => {
    const [categories, recentPosts, archiveRows] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: sidebarCategorySelect,
        where: { parentId: null },
      }),
      prisma.post.findMany({
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        select: recentPostSelect,
        take: 5,
        where: { status: "PUBLISHED" },
      }),
      prisma.$queryRaw<SidebarArchiveRow[]>`
        SELECT
          to_char(date_trunc('month', "publishedAt"), 'YYYY-MM') AS month,
          COUNT(*) AS count
        FROM posts
        WHERE status::text = 'PUBLISHED'
          AND "publishedAt" IS NOT NULL
        GROUP BY date_trunc('month', "publishedAt")
        ORDER BY date_trunc('month', "publishedAt") DESC
        LIMIT 12
      `,
    ])

    const archives = archiveRows.map((archive) => ({
      count: Number(archive.count),
      month: archive.month,
    }))

    const categoriesWithCount = categories.map((cat) => {
      const childCount = (cat.children ?? []).reduce(
        (sum, child) => sum + (child._count?.posts ?? 0),
        0,
      )
      if (cat._count === undefined) {
        return cat
      }
      return {
        ...cat,
        _count: {
          posts: cat._count.posts + childCount,
        },
      }
    })

    return { archives, categories: categoriesWithCount, recentPosts }
  },
  ["sidebar-data"],
  { revalidate: 300, tags: ["posts", "categories"] },
)

export const getCachedCommandCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: commandCategorySelect,
    }),
  ["command-categories"],
  { revalidate: 300, tags: ["categories"] },
)

export const getCachedPublishedPost = unstable_cache(
  async (slug: string) =>
    prisma.post.findUnique({
      select: publishedPostDetailSelect,
      where: { slug, status: "PUBLISHED" },
    }),
  ["published-post"],
  { revalidate: 300, tags: ["posts", "comments"] },
)

export const getCachedContributors = unstable_cache(
  async () =>
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: contributorSelect,
      where: { role: { in: ["ADMIN", "WRITER"] } },
    }),
  ["contributors"],
  { revalidate: 300, tags: ["posts", "users"] },
)

export const getCachedEditorReferenceData = unstable_cache(
  async () => {
    const [categories, writers] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: editorCategorySelect,
        where: { parentId: null },
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
      WHERE p.status::text <> 'ARCHIVED'
        AND (
          p."authorId" = ${userId}
          OR EXISTS (
            SELECT 1
            FROM post_authors invited
            WHERE invited."postId" = p.id
              AND invited."userId" = ${userId}
              AND invited.status::text IN ('ACCEPTED', 'PENDING')
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
        (SELECT COUNT(*) FROM posts WHERE status::text = 'PUBLISHED') AS "publishedPosts",
        (SELECT COUNT(*) FROM posts WHERE status::text = 'DRAFT') AS "draftPosts",
        (SELECT COUNT(*) FROM posts WHERE status::text = 'ARCHIVED') AS "archivedPosts",
        (SELECT COUNT(*) FROM users WHERE role::text = 'WRITER') AS "writers",
        (SELECT COUNT(*) FROM comments WHERE status::text = 'APPROVED') AS "approvedComments",
        (SELECT COUNT(*) FROM newsletter_subscribers WHERE status::text = 'ACTIVE') AS "activeSubscribers"
    `

    return {
      activeSubscribers: countToNumber(stats?.activeSubscribers),
      approvedComments: countToNumber(stats?.approvedComments),
      archivedPosts: countToNumber(stats?.archivedPosts),
      draftPosts: countToNumber(stats?.draftPosts),
      publishedPosts: countToNumber(stats?.publishedPosts),
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
  ) => {
    const offset = (page - 1) * pageSize
    const statusFilter = status
      ? Prisma.sql`WHERE p.status::text = ${status}`
      : Prisma.empty
    const orderBy =
      sort === "oldest"
        ? Prisma.sql`ORDER BY "publishedAt" ASC NULLS LAST, "updatedAt" ASC`
        : sort === "comments"
          ? Prisma.sql`ORDER BY "commentCount" DESC, "publishedAt" DESC NULLS LAST`
          : Prisma.sql`ORDER BY "publishedAt" DESC NULLS FIRST, "updatedAt" DESC`
    const rows = await prisma.$queryRaw<AdminPostRow[]>`
      WITH filtered AS (
        SELECT
          p.id,
          p.title,
          p.slug,
          p.status::text AS status,
          p."publishedAt",
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
        ${orderBy}
        LIMIT ${pageSize} OFFSET ${offset}
      )
      SELECT counted."totalCount", paged.*
      FROM counted
      LEFT JOIN paged ON TRUE
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
        publishedAt: row.publishedAt,
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
          c.content,
          c."createdAt",
          c.status::text AS status,
          p.slug AS "postSlug",
          p.title AS "postTitle"
        FROM comments c
        JOIN posts p ON p.id = c."postId"
        WHERE c.status::text = ${status}
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
        (SELECT COUNT(*) FROM comments WHERE status::text = 'APPROVED') AS "approvedComments",
        (SELECT COUNT(*) FROM comments WHERE status::text = 'SPAM') AS "spamComments"
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
        where: { parentId: null },
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

export const getCachedAdminDashboardRecentData = unstable_cache(
  async () => {
    const [recentPosts, recentComments] = await Promise.all([
      prisma.post.findMany({
        orderBy: [{ updatedAt: "desc" }],
        select: adminDashboardRecentPostSelect,
        take: 5,
      }),
      prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        select: adminDashboardRecentCommentSelect,
        take: 5,
        where: { status: "APPROVED" },
      }),
    ])

    return { recentComments, recentPosts }
  },
  ["admin-dashboard-recent-data"],
  { revalidate: 60, tags: ["posts", "comments"] },
)

export const getCachedAdminNewsletterData = unstable_cache(
  async () => {
    const [activeCount, recentPosts] = await Promise.all([
      prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      prisma.post.findMany({
        orderBy: { publishedAt: "desc" },
        select: newsletterRecentPostSelect,
        take: 10,
        where: { status: "PUBLISHED" },
      }),
    ])

    return { activeCount, recentPosts }
  },
  ["admin-newsletter-data"],
  { revalidate: 60, tags: ["newsletter", "posts"] },
)

export const getCachedAdminAnalyticsData = unstable_cache(
  async (startAt: number, endAt: number) => {
    const [stats, topPages] = await Promise.all([
      getInternalAnalyticsStats(startAt, endAt),
      getInternalTopPages(startAt, endAt, 5),
    ])

    return { stats, topPages }
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

export const getCachedWriterEvents = unstable_cache(
  async (userId: string) => {
    const rows = await prisma.$queryRaw<WriterEventRow[]>`
      SELECT
        e.id,
        CASE
          WHEN final_post.slug IS NULL THEN NULL
          ELSE json_build_object('slug', final_post.slug)
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
      WHERE e.status::text IN ('OPEN', 'PUBLISHED')
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
        p.status::text = 'PUBLISHED'
        AND EXISTS (
          SELECT 1
          FROM categories c
          LEFT JOIN categories parent ON parent.id = c."parentId"
          WHERE c.id = p."categoryId"
            AND (c.slug = ${categorySlug} OR parent.slug = ${categorySlug})
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
        p.status::text = 'PUBLISHED'
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
        p.status::text = 'PUBLISHED'
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
              AND co_author.username = ${username}
          )
        )
      `,
      page,
      pageSize,
      sort,
    ),
  ["author-posts"],
  { revalidate: 300, tags: ["posts", "users"] },
)

export const getCachedSearchResults = unstable_cache(
  async (
    tsQuery: string,
    page: number,
    pageSize: number,
    categorySlug?: string,
    tagSlug?: string,
  ) => {
    const offset = (page - 1) * pageSize
    const categoryCondition = categorySlug
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM categories c
          WHERE c.id = p."categoryId" AND c.slug = ${categorySlug}
        )`
      : Prisma.empty

    const tagCondition = tagSlug
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM post_tags pt
          JOIN tags t ON t.id = pt."tagId"
          WHERE pt."postId" = p.id AND t.slug = ${tagSlug}
        )`
      : Prisma.empty

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
          ts_rank(p.search_vector, to_tsquery('simple', ${tsQuery})) AS rank,
          ts_headline(
            'simple',
            COALESCE(p."contentText", ''),
            to_tsquery('simple', ${tsQuery}),
            'MaxWords=34, MinWords=12, StartSel=<mark>, StopSel=</mark>, HighlightAll=false'
          ) AS snippet
        FROM posts p
        JOIN users u ON u.id = p."authorId"
        WHERE
          p.status = 'PUBLISHED'
          AND p.search_vector @@ to_tsquery('simple', ${tsQuery})
          ${categoryCondition}
          ${tagCondition}
        ORDER BY rank DESC, p."publishedAt" DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM posts p
        WHERE
          p.status = 'PUBLISHED'
          AND p.search_vector @@ to_tsquery('simple', ${tsQuery})
          ${categoryCondition}
          ${tagCondition}
      `,
    ])
    const total = Number(countResult[0]?.count ?? 0)

    return { results, total }
  },
  ["search-results"],
  { revalidate: 60, tags: ["posts"] },
)
