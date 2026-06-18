import { beforeEach, describe, expect, it, vi } from "vitest"

type CacheEntry = {
  keyParts: string[]
  options: { revalidate?: number; tags?: string[] }
}

const mocks = vi.hoisted(() => {
  const cacheEntries: CacheEntry[] = []
  const prisma = {
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    awardEvent: { findMany: vi.fn() },
    category: { findMany: vi.fn(), findUnique: vi.fn() },
    comment: { count: vi.fn(), findMany: vi.fn() },
    invite: { findMany: vi.fn() },
    newsletterSubscriber: { count: vi.fn() },
    post: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    tag: { findMany: vi.fn(), findUnique: vi.fn() },
    user: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  }

  return {
    cacheEntries,
    prisma,
    unstableCache: vi.fn(
      <Args extends unknown[], Result>(
        callback: (...args: Args) => Promise<Result>,
        keyParts: string[],
        options: CacheEntry["options"],
      ) => {
        cacheEntries.push({ keyParts, options })
        return callback
      },
    ),
  }
})

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({ unstable_cache: mocks.unstableCache }))

import {
  getCachedAdminCommentCounts,
  getCachedAdminComments,
  getCachedAdminContentData,
  getCachedAdminDashboardRecentData,
  getCachedAdminDashboardStats,
  getCachedAdminNewsletterData,
  getCachedAdminPosts,
  getCachedAdminWritersData,
  getCachedAuthorByUsername,
  getCachedAuthorPosts,
  getCachedCategoryBySlug,
  getCachedCategoryPosts,
  getCachedContributors,
  getCachedEditorReferenceData,
  getCachedPublishedPost,
  getCachedPublishedPosts,
  getCachedProfileUser,
  getCachedSearchResults,
  getCachedSidebarData,
  getCachedTagBySlug,
  getCachedTagPosts,
  getCachedWriterDashboardPosts,
  getCachedWriterEvents,
} from "@/lib/queries"

describe("cached Prisma query helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.$queryRaw.mockReset()
    mocks.prisma.$transaction.mockReset()
    mocks.prisma.awardEvent.findMany.mockReset()
    mocks.prisma.category.findMany.mockReset()
    mocks.prisma.category.findUnique.mockReset()
    mocks.prisma.comment.count.mockReset()
    mocks.prisma.comment.findMany.mockReset()
    mocks.prisma.invite.findMany.mockReset()
    mocks.prisma.newsletterSubscriber.count.mockReset()
    mocks.prisma.post.count.mockReset()
    mocks.prisma.post.findMany.mockReset()
    mocks.prisma.post.findUnique.mockReset()
    mocks.prisma.tag.findMany.mockReset()
    mocks.prisma.tag.findUnique.mockReset()
    mocks.prisma.user.count.mockReset()
    mocks.prisma.user.findMany.mockReset()
    mocks.prisma.user.findUnique.mockReset()
    mocks.prisma.$transaction.mockImplementation(async (input) =>
      Promise.all(input),
    )
  })

  it("caches paginated published post lists behind the posts tag", async () => {
    mocks.prisma.post.findMany.mockResolvedValue([{ slug: "essay" }])
    mocks.prisma.post.count.mockResolvedValue(1)

    // Test default sorting (latest)
    await expect(getCachedPublishedPosts(2, 10)).resolves.toEqual({
      posts: [{ slug: "essay" }],
      total: 1,
    })

    expect(mocks.prisma.post.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        skip: 10,
        take: 10,
        where: { status: "PUBLISHED" },
      }),
    )

    // Test comments sorting
    await expect(getCachedPublishedPosts(1, 10, "comments")).resolves.toEqual({
      posts: [{ slug: "essay" }],
      total: 1,
    })

    expect(mocks.prisma.post.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        orderBy: [{ comments: { _count: "desc" } }, { publishedAt: "desc" }],
        skip: 0,
        take: 10,
        where: { status: "PUBLISHED" },
      }),
    )

    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
    const select = mocks.prisma.post.findMany.mock.calls[0]?.[0].select
    expect(select.author.select).not.toHaveProperty("email")
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["published-posts"],
      options: { revalidate: 60, tags: ["posts"] },
    })
  })

  it("filters published post lists by archive month", async () => {
    mocks.prisma.post.findMany.mockResolvedValue([{ slug: "june-essay" }])
    mocks.prisma.post.count.mockResolvedValue(1)

    await expect(
      getCachedPublishedPosts(1, 10, "latest", "2026-06"),
    ).resolves.toEqual({
      posts: [{ slug: "june-essay" }],
      total: 1,
    })

    expect(mocks.prisma.post.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          publishedAt: {
            gte: new Date("2026-06-01T00:00:00.000Z"),
            lt: new Date("2026-07-01T00:00:00.000Z"),
          },
          status: "PUBLISHED",
        },
      }),
    )
  })

  it("caches sidebar data behind posts and categories tags", async () => {
    mocks.prisma.category.findMany.mockResolvedValue([{ slug: "analysis" }])
    mocks.prisma.post.findMany.mockResolvedValue([{ slug: "recent" }])
    mocks.prisma.$queryRaw.mockResolvedValue([
      { count: BigInt(2), month: "2026-06" },
    ])

    await expect(getCachedSidebarData()).resolves.toEqual({
      archives: [{ count: 2, month: "2026-06" }],
      categories: [{ slug: "analysis" }],
      recentPosts: [{ slug: "recent" }],
    })

    expect(mocks.prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
        select: expect.objectContaining({
          _count: expect.any(Object),
          children: expect.any(Object),
        }),
        where: { parentId: null },
      }),
    )
    expect(mocks.prisma.$queryRaw).toHaveBeenCalled()
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["sidebar-data"],
      options: { revalidate: 300, tags: ["posts", "categories"] },
    })
  })

  it("caches published post detail and comments for post pages", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      comments: [],
      slug: "essay",
    })

    await expect(getCachedPublishedPost("essay")).resolves.toEqual({
      comments: [],
      slug: "essay",
    })

    expect(mocks.prisma.post.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "essay", status: "PUBLISHED" },
      }),
    )
    const select = mocks.prisma.post.findUnique.mock.calls[0]?.[0].select
    expect(select.author.select).not.toHaveProperty("email")
    expect(select.comments.select).not.toHaveProperty("authorEmail")
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["published-post"],
      options: { revalidate: 300, tags: ["posts", "comments"] },
    })
  })

  it("caches contributors without exposing private email addresses", async () => {
    mocks.prisma.user.findMany.mockResolvedValue([
      { name: "Mina", username: "mina" },
    ])

    await expect(getCachedContributors()).resolves.toEqual([
      { name: "Mina", username: "mina" },
    ])

    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
        where: { role: { in: ["ADMIN", "WRITER"] } },
      }),
    )
    const select = mocks.prisma.user.findMany.mock.calls[0]?.[0].select
    expect(select).not.toHaveProperty("email")
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["contributors"],
      options: { revalidate: 300, tags: ["posts", "users"] },
    })
  })

  it("caches editor reference data behind categories and users tags", async () => {
    mocks.prisma.category.findMany.mockResolvedValue([{ slug: "analysis" }])
    mocks.prisma.user.findMany.mockResolvedValue([{ username: "mina" }])

    await expect(getCachedEditorReferenceData()).resolves.toEqual({
      categories: [{ slug: "analysis" }],
      writers: [{ username: "mina" }],
    })

    expect(mocks.prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
        where: { parentId: null },
      }),
    )
    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
        select: { id: true, name: true, username: true },
        where: { role: { in: ["ADMIN", "WRITER"] } },
      }),
    )
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["editor-reference-data"],
      options: { revalidate: 300, tags: ["categories", "users"] },
    })
  })

  it("caches writer dashboard posts by user id behind the posts tag", async () => {
    mocks.prisma.post.findMany.mockResolvedValue([{ id: "post-1" }])

    await expect(getCachedWriterDashboardPosts("writer-1")).resolves.toEqual([
      { id: "post-1" },
    ])

    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updatedAt: "desc" },
        where: {
          OR: [
            { authorId: "writer-1" },
            {
              coAuthors: {
                some: {
                  status: { in: ["ACCEPTED", "PENDING"] },
                  userId: "writer-1",
                },
              },
            },
          ],
          status: { not: "ARCHIVED" },
        },
      }),
    )
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["writer-dashboard-posts"],
      options: { revalidate: 60, tags: ["posts"] },
    })
  })

  it("caches profile form data by user id behind the users tag", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      email: "writer@example.com",
      username: "writer",
    })

    await expect(getCachedProfileUser("writer-1")).resolves.toEqual({
      email: "writer@example.com",
      username: "writer",
    })

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      select: {
        avatarUrl: true,
        bio: true,
        email: true,
        name: true,
        username: true,
      },
      where: { id: "writer-1" },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["profile-user"],
      options: { revalidate: 300, tags: ["users"] },
    })
  })

  it("caches admin dashboard stats behind all content tags", async () => {
    mocks.prisma.$queryRaw.mockResolvedValue([
      {
        activeSubscribers: BigInt(21),
        approvedComments: BigInt(12),
        archivedPosts: BigInt(1),
        draftPosts: BigInt(2),
        publishedPosts: BigInt(8),
        writers: BigInt(3),
      },
    ])

    await expect(getCachedAdminDashboardStats()).resolves.toEqual({
      activeSubscribers: 21,
      approvedComments: 12,
      archivedPosts: 1,
      draftPosts: 2,
      publishedPosts: 8,
      writers: 3,
    })

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.prisma.post.count).not.toHaveBeenCalled()
    expect(mocks.prisma.user.count).not.toHaveBeenCalled()
    expect(mocks.prisma.comment.count).not.toHaveBeenCalled()
    expect(mocks.prisma.newsletterSubscriber.count).not.toHaveBeenCalled()
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["admin-dashboard-stats"],
      options: {
        revalidate: 60,
        tags: ["posts", "comments", "users", "newsletter"],
      },
    })
  })

  it("caches admin post and comment pages behind their write tags with one query each", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          authorName: "Mina",
          authorUsername: "mina",
          commentCount: BigInt(4),
          id: "post-1",
          publishedAt: null,
          slug: "draft",
          status: "DRAFT",
          title: "Draft",
          totalCount: BigInt(1),
          updatedAt: new Date("2024-04-01T00:00:00Z"),
        },
      ])
      .mockResolvedValueOnce([
        {
          authorName: "Reader",
          content: "Good post",
          createdAt: new Date("2024-04-02T00:00:00Z"),
          id: "comment-1",
          postSlug: "draft",
          postTitle: "Draft",
          status: "APPROVED",
          totalCount: BigInt(1),
        },
      ])

    await expect(getCachedAdminPosts(2, "DRAFT", 20)).resolves.toEqual({
      posts: [
        {
          _count: { comments: 4 },
          author: { name: "Mina", username: "mina" },
          id: "post-1",
          publishedAt: null,
          slug: "draft",
          status: "DRAFT",
          title: "Draft",
          updatedAt: new Date("2024-04-01T00:00:00Z"),
        },
      ],
      total: 1,
    })
    await expect(getCachedAdminComments(1, "APPROVED", 30)).resolves.toEqual({
      comments: [
        {
          authorName: "Reader",
          content: "Good post",
          createdAt: new Date("2024-04-02T00:00:00Z"),
          id: "comment-1",
          post: { slug: "draft", title: "Draft" },
          status: "APPROVED",
        },
      ],
      total: 1,
    })

    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      {
        approvedComments: BigInt(3),
        spamComments: BigInt(2),
      },
    ])
    await expect(getCachedAdminCommentCounts()).resolves.toEqual({
      approvedComments: 3,
      pendingComments: 0,
      spamComments: 2,
    })

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(3)
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.post.count).not.toHaveBeenCalled()
    expect(mocks.prisma.comment.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.comment.count).not.toHaveBeenCalled()
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["admin-posts"],
      options: { revalidate: 60, tags: ["posts"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["admin-comments"],
      options: { revalidate: 60, tags: ["comments"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["admin-comment-counts"],
      options: { revalidate: 60, tags: ["comments"] },
    })
  })

  it("supports shared latest, oldest, and comment sorting for admin posts", async () => {
    mocks.prisma.$queryRaw.mockResolvedValue([
      {
        authorName: null,
        authorUsername: null,
        commentCount: null,
        id: null,
        publishedAt: null,
        slug: null,
        status: null,
        title: null,
        totalCount: BigInt(0),
        updatedAt: null,
      },
    ])

    await getCachedAdminPosts(1, undefined, 20, "latest")
    await getCachedAdminPosts(1, undefined, 20, "oldest")
    await getCachedAdminPosts(1, undefined, 20, "comments")

    const rawSql = mocks.prisma.$queryRaw.mock.calls
      .flatMap((call) =>
        call.flatMap((value) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "strings" in value &&
            Array.isArray(value.strings)
          ) {
            return value.strings.map(String)
          }

          return [String(value)]
        }),
      )
      .join("\n")

    expect(rawSql).toContain('ORDER BY "publishedAt" DESC NULLS FIRST, "updatedAt" DESC')
    expect(rawSql).toContain('ORDER BY "publishedAt" ASC NULLS LAST, "updatedAt" ASC')
    expect(rawSql).toContain('ORDER BY "commentCount" DESC, "publishedAt" DESC NULLS LAST')
  })

  it("caches admin writer and newsletter data with matching tags", async () => {
    mocks.prisma.user.findMany.mockResolvedValue([{ username: "writer" }])
    mocks.prisma.invite.findMany.mockResolvedValue([{ email: "new@example.com" }])
    mocks.prisma.newsletterSubscriber.count.mockResolvedValue(42)
    mocks.prisma.post.findMany.mockResolvedValue([{ title: "Recent essay" }])

    await expect(getCachedAdminWritersData()).resolves.toEqual({
      pendingInvites: [{ email: "new@example.com" }],
      writers: [{ username: "writer" }],
    })
    await expect(getCachedAdminNewsletterData()).resolves.toEqual({
      activeCount: 42,
      recentPosts: [{ title: "Recent essay" }],
    })

    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "WRITER" },
      }),
    )
    expect(mocks.prisma.invite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { expiresAt: { gt: expect.any(Date) }, status: "PENDING" },
      }),
    )
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["admin-writers-data"],
      options: { revalidate: 60, tags: ["users", "invites"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["admin-newsletter-data"],
      options: { revalidate: 60, tags: ["newsletter", "posts"] },
    })
  })

  it("caches shared admin content, dashboard recents, and writer events data", async () => {
    mocks.prisma.category.findMany.mockResolvedValue([{ id: "category-1" }])
    mocks.prisma.tag.findMany.mockResolvedValue([{ id: "tag-1" }])
    mocks.prisma.post.findMany.mockResolvedValue([{ id: "post-1" }])
    mocks.prisma.comment.findMany.mockResolvedValue([{ id: "comment-1" }])
    mocks.prisma.awardEvent.findMany.mockResolvedValue([{ id: "event-1" }])

    await expect(getCachedAdminContentData()).resolves.toEqual({
      categories: [{ id: "category-1" }],
      tags: [{ id: "tag-1" }],
    })
    await expect(getCachedAdminDashboardRecentData()).resolves.toEqual({
      recentComments: [{ id: "comment-1" }],
      recentPosts: [{ id: "post-1" }],
    })
    await expect(getCachedWriterEvents("writer-1")).resolves.toEqual([
      { id: "event-1" },
    ])

    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["admin-content-data"],
      options: { revalidate: 60, tags: ["categories", "tags", "posts"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["admin-dashboard-recent-data"],
      options: { revalidate: 60, tags: ["posts", "comments"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["writer-events"],
      options: { revalidate: 60, tags: ["award-events"] },
    })
  })

  it("caches public category entities and post lists", async () => {
    mocks.prisma.category.findUnique.mockResolvedValueOnce({
      description: "Production essays",
      id: "category-1",
      name: "Production",
      slug: "production",
    })
    mocks.prisma.post.findMany.mockResolvedValue([{ slug: "essay" }])
    mocks.prisma.post.count.mockResolvedValue(1)

    await expect(getCachedCategoryBySlug("production")).resolves.toEqual({
      description: "Production essays",
      id: "category-1",
      name: "Production",
      slug: "production",
    })
    await expect(getCachedCategoryPosts("category-1", 2, 10, "comments")).resolves.toEqual({
      posts: [{ slug: "essay" }],
      total: 1,
    })

    expect(mocks.prisma.category.findUnique).toHaveBeenCalledWith({
      select: { description: true, id: true, name: true, slug: true },
      where: { slug: "production" },
    })
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ comments: { _count: "desc" } }, { publishedAt: "desc" }],
        skip: 10,
        take: 10,
        where: { categoryId: "category-1", status: "PUBLISHED" },
      }),
    )
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["category-by-slug"],
      options: { revalidate: 300, tags: ["categories"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["category-posts"],
      options: { revalidate: 60, tags: ["posts", "categories"] },
    })
  })

  it("caches public tag entities and post lists", async () => {
    mocks.prisma.tag.findUnique.mockResolvedValue({
      id: "tag-1",
      name: "Sakuga",
      slug: "sakuga",
    })
    mocks.prisma.post.findMany.mockResolvedValue([{ slug: "essay" }])
    mocks.prisma.post.count.mockResolvedValue(1)

    await expect(getCachedTagBySlug("sakuga")).resolves.toEqual({
      id: "tag-1",
      name: "Sakuga",
      slug: "sakuga",
    })
    await expect(getCachedTagPosts("tag-1", 1, 10, "oldest")).resolves.toEqual({
      posts: [{ slug: "essay" }],
      total: 1,
    })

    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ publishedAt: "asc" }, { updatedAt: "asc" }],
        where: {
          status: "PUBLISHED",
          tags: { some: { tagId: "tag-1" } },
        },
      }),
    )
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["tag-by-slug"],
      options: { revalidate: 300, tags: ["tags"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["tag-posts"],
      options: { revalidate: 60, tags: ["posts", "tags"] },
    })
  })

  it("caches public author entities and post lists behind the users tag", async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      avatarUrl: null,
      bio: "Animation critic",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      id: "user-1",
      name: "Mina",
      username: "mina",
    })
    mocks.prisma.post.findMany.mockResolvedValue([{ slug: "essay" }])
    mocks.prisma.post.count.mockResolvedValue(1)

    await expect(getCachedAuthorByUsername("mina")).resolves.toEqual(
      expect.objectContaining({ id: "user-1", username: "mina" }),
    )
    await expect(getCachedAuthorPosts("user-1", 1, 10, "comments")).resolves.toEqual({
      posts: [{ slug: "essay" }],
      total: 1,
    })

    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ comments: { _count: "desc" } }, { publishedAt: "desc" }],
        where: {
          OR: [
            { authorId: "user-1" },
            { coAuthors: { some: { userId: "user-1" } } },
          ],
          status: "PUBLISHED",
        },
      }),
    )
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["author-by-username"],
      options: { revalidate: 300, tags: ["users"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["author-posts"],
      options: { revalidate: 60, tags: ["posts", "users"] },
    })
  })

  it("caches full-text search results behind the posts tag", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([{ id: "post-1", slug: "essay" }])
      .mockResolvedValueOnce([{ count: 1 }])

    await expect(getCachedSearchResults("sakuga:*", 2, 5)).resolves.toEqual({
      results: [{ id: "post-1", slug: "essay" }],
      total: 1,
    })

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(2)
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["search-results"],
      options: { revalidate: 60, tags: ["posts"] },
    })
  })
})
