import { unstable_cache } from "next/cache"
import { Prisma, type CommentStatus, type PostStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import type { SearchResult } from "@/lib/search"

const publishedPostListSelect = {
  _count: { select: { comments: true } },
  author: {
    select: { avatarUrl: true, name: true, username: true },
  },
  category: { select: { id: true, name: true, slug: true } },
  coAuthors: {
    orderBy: { order: "asc" },
    select: {
      user: {
        select: { avatarUrl: true, name: true, username: true },
      },
    },
  },
  coverAlt: true,
  coverUrl: true,
  excerpt: true,
  publishedAt: true,
  slug: true,
  tags: {
    select: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
  title: true,
} satisfies Prisma.PostSelect

const sidebarCategorySelect = {
  _count: {
    select: { posts: { where: { status: "PUBLISHED" } } },
  },
  children: {
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
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

const writerDashboardPostSelect = {
  _count: { select: { comments: true } },
  authorId: true,
  coAuthors: { select: { status: true, userId: true } },
  draftVisibility: true,
  id: true,
  publishedAt: true,
  slug: true,
  status: true,
  title: true,
  updatedAt: true,
} satisfies Prisma.PostSelect

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
    orderBy: { createdAt: "asc" },
    select: {
      author: {
        select: {
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
        orderBy: { createdAt: "asc" },
        select: {
          author: {
            select: {
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

export type PublishedPostListItem = Prisma.PostGetPayload<{
  select: typeof publishedPostListSelect
}>
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

async function getPublishedPostListByWhere(
  where: Prisma.PostWhereInput,
  page: number,
  pageSize: number,
) {
  const posts = await prisma.post.findMany({
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: publishedPostListSelect,
    skip: (page - 1) * pageSize,
    take: pageSize,
    where,
  })
  const total = await prisma.post.count({ where })

  return { posts, total }
}

export const getCachedPublishedPosts = unstable_cache(
  async (page: number, pageSize: number) => {
    const where = { status: "PUBLISHED" } satisfies Prisma.PostWhereInput
    return getPublishedPostListByWhere(where, page, pageSize)
  },
  ["published-posts"],
  { revalidate: 60, tags: ["posts"] },
)

export const getCachedSidebarData = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: sidebarCategorySelect,
      where: { parentId: null },
    })
    const recentPosts = await prisma.post.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: recentPostSelect,
      take: 5,
      where: { status: "PUBLISHED" },
    })

    return { categories, recentPosts }
  },
  ["sidebar-data"],
  { revalidate: 300, tags: ["posts", "categories"] },
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
  async (userId: string) =>
    prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      select: writerDashboardPostSelect,
      where: {
        OR: [
          { authorId: userId },
          { coAuthors: { some: { userId } } },
        ],
        status: { not: "ARCHIVED" },
      },
    }),
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
  async (page: number, status: PostStatus | undefined, pageSize: number) => {
    const offset = (page - 1) * pageSize
    const statusFilter = status
      ? Prisma.sql`WHERE p.status::text = ${status}`
      : Prisma.empty
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
        ORDER BY "publishedAt" DESC NULLS FIRST, "updatedAt" DESC
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
  async (categoryId: string, page: number, pageSize: number) =>
    getPublishedPostListByWhere(
      { categoryId, status: "PUBLISHED" },
      page,
      pageSize,
    ),
  ["category-posts"],
  { revalidate: 60, tags: ["posts", "categories"] },
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
  async (tagId: string, page: number, pageSize: number) =>
    getPublishedPostListByWhere(
      {
        status: "PUBLISHED",
        tags: { some: { tagId } },
      },
      page,
      pageSize,
    ),
  ["tag-posts"],
  { revalidate: 60, tags: ["posts", "tags"] },
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
  async (authorId: string, page: number, pageSize: number) =>
    getPublishedPostListByWhere(
      {
        OR: [
          { authorId },
          { coAuthors: { some: { userId: authorId } } },
        ],
        status: "PUBLISHED",
      },
      page,
      pageSize,
    ),
  ["author-posts"],
  { revalidate: 60, tags: ["posts", "users"] },
)

export const getCachedSearchResults = unstable_cache(
  async (tsQuery: string, page: number, pageSize: number) => {
    const offset = (page - 1) * pageSize
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
      `,
    ])
    const total = Number(countResult[0]?.count ?? 0)

    return { results, total }
  },
  ["search-results"],
  { revalidate: 60, tags: ["posts"] },
)
