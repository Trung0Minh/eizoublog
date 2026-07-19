import { beforeEach, describe, expect, it, vi } from "vitest"

type CacheEntry = {
  keyParts: string[]
  options: { revalidate?: number; tags?: string[] }
}

function flattenSql(value: unknown): string {
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.map(flattenSql).join(" ")
  if (typeof value !== "object" || value === null) return ""

  return Object.values(value)
    .map(flattenSql)
    .join(" ")
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
    newsletterBroadcast: {
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    newsletterSubscriber: { count: vi.fn() },
    post: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    sitePage: { findUnique: vi.fn() },
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
  getCachedAdminDashboardStats,
  getCachedAdminNewsletterData,
  getCachedAdminPosts,
  getCachedAdminWritersData,
  getCachedAuthorByUsername,
  getCachedAuthorPosts,
  getCachedCommandCategories,
  getCachedCategoryBySlug,
  getCachedCategoryPosts,
  getCachedContributors,
  getCachedEditorReferenceData,
  getCachedPublishedPost,
  getCachedPublishedPosts,
  getCachedProfileUser,
  getCachedSearchResults,
  getCachedSearchTaxonomy,
  getCachedSidebarData,
  getCachedSitePage,
  getCachedTagBySlug,
  getCachedTagPosts,
  getCachedWriterDashboardPosts,
  getCachedWriterEvents,
} from "@/lib/queries"

describe("cached Prisma query helpers", () => {
  const rawPostRow = {
    author: { avatarUrl: null, name: "Mina", username: "mina" },
    category: { id: "category-1", name: "Production", slug: "production" },
    coAuthors: [],
    commentCount: BigInt(2),
    coverAlt: null,
    coverUrl: null,
    excerpt: "Summary",
    publishedAt: new Date("2026-06-01T00:00:00Z"),
    slug: "essay",
    tags: [{ tag: { id: "tag-1", name: "Sakuga", slug: "sakuga" } }],
    title: "Essay",
    totalCount: BigInt(1),
  }

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
    mocks.prisma.newsletterBroadcast.aggregate.mockReset()
    mocks.prisma.newsletterBroadcast.count.mockReset()
    mocks.prisma.newsletterBroadcast.findMany.mockReset()
    mocks.prisma.newsletterSubscriber.count.mockReset()
    mocks.prisma.post.count.mockReset()
    mocks.prisma.post.findMany.mockReset()
    mocks.prisma.post.findUnique.mockReset()
    mocks.prisma.sitePage.findUnique.mockReset()
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
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([rawPostRow])
      .mockResolvedValueOnce([rawPostRow])

    // Test default sorting (latest)
    await expect(getCachedPublishedPosts(2, 10)).resolves.toEqual({
      posts: [
        {
          _count: { comments: 2 },
          author: { avatarUrl: null, name: "Mina", username: "mina" },
          category: { id: "category-1", name: "Production", slug: "production" },
          coAuthors: [],
          coverAlt: null,
          coverUrl: null,
          excerpt: "Summary",
          publishedAt: new Date("2026-06-01T00:00:00Z"),
          slug: "essay",
          tags: [{ tag: { id: "tag-1", name: "Sakuga", slug: "sakuga" } }],
          title: "Essay",
        },
      ],
      total: 1,
    })

    // Test comments sorting
    await expect(getCachedPublishedPosts(1, 10, "comments")).resolves.toEqual({
      posts: [expect.objectContaining({ _count: { comments: 2 }, slug: "essay" })],
      total: 1,
    })

    const latestSql = String(mocks.prisma.$queryRaw.mock.calls[0]?.[0])
    const commentsSql = String(mocks.prisma.$queryRaw.mock.calls[1]?.[0])
    expect(latestSql.indexOf("LIMIT")).toBeLessThan(
      latestSql.indexOf("FROM comments"),
    )
    expect(commentsSql.indexOf("FROM comments")).toBeLessThan(
      commentsSql.indexOf("LIMIT"),
    )
    expect(latestSql).not.toContain("p.status::text = 'PUBLISHED'")
    expect(commentsSql).not.toContain("p.status::text = 'PUBLISHED'")
    expect(latestSql).toContain("LEFT JOIN award_events final_event")
    expect(commentsSql).toContain("LEFT JOIN award_events final_event")
    expect(latestSql).toContain('final_event.intro AS "eventIntro"')
    expect(commentsSql).toContain('final_event.intro AS "eventIntro"')

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(2)
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.post.count).not.toHaveBeenCalled()
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["published-posts"],
      options: { revalidate: 300, tags: ["posts"] },
    })
  })

  it("uses live event rich text as the homepage subtitle", async () => {
    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      {
        ...rawPostRow,
        eventIntro: {
          content: [
            {
              content: [{ text: "Complete first paragraph.", type: "text" }],
              type: "paragraph",
            },
            {
              content: [{ text: "Complete ending.", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "doc",
        },
        eventIntroText: "Truncated event introduction",
        excerpt: "Old generated excerpt",
      },
    ])

    await expect(getCachedPublishedPosts(1, 10)).resolves.toMatchObject({
      posts: [
        {
          excerpt: "Complete first paragraph. Complete ending.",
          slug: "essay",
        },
      ],
    })
  })

  it("preserves newest and oldest ordering after the final joined query", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([rawPostRow])
      .mockResolvedValueOnce([rawPostRow])

    await getCachedPublishedPosts(1, 10, "latest")
    await getCachedPublishedPosts(1, 10, "oldest")

    const latestSql = flattenSql(mocks.prisma.$queryRaw.mock.calls[0])
    const oldestSql = flattenSql(mocks.prisma.$queryRaw.mock.calls[1])

    expect(
      latestSql.match(/ORDER BY p\."publishedAt" DESC NULLS LAST/g),
    ).toHaveLength(2)
    expect(
      oldestSql.match(/ORDER BY p\."publishedAt" ASC NULLS LAST/g),
    ).toHaveLength(2)
  })

  it("filters published post lists by archive month", async () => {
    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      { ...rawPostRow, slug: "june-essay" },
    ])

    await expect(
      getCachedPublishedPosts(1, 10, "latest", "2026-06"),
    ).resolves.toEqual({
      posts: [expect.objectContaining({ slug: "june-essay" })],
      total: 1,
    })

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.post.count).not.toHaveBeenCalled()
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
        }),
        where: { posts: { some: { status: "PUBLISHED" } } },
      }),
    )
    expect(mocks.prisma.$queryRaw).toHaveBeenCalled()
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["sidebar-data"],
      options: { revalidate: 300, tags: ["posts", "categories"] },
    })
  })

  it("caches command menu categories with a lightweight select", async () => {
    mocks.prisma.category.findMany.mockResolvedValue([
      { id: "category-1", name: "Production", slug: "production" },
    ])

    await expect(getCachedCommandCategories()).resolves.toEqual([
      { id: "category-1", name: "Production", slug: "production" },
    ])

    expect(mocks.prisma.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["command-categories"],
      options: { revalidate: 300, tags: ["categories"] },
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
      keyParts: ["published-post", "essay"],
      options: {
        revalidate: 300,
        tags: ["posts", "users", "post-detail:essay"],
      },
    })
  })

  it("caches editable site pages and search taxonomy data", async () => {
    mocks.prisma.sitePage.findUnique.mockResolvedValue({
      content: { title: "About" },
      contentText: "About",
    })
    mocks.prisma.category.findMany.mockResolvedValue([
      { name: "Analysis", slug: "analysis" },
    ])
    mocks.prisma.tag.findMany.mockResolvedValue([
      { name: "Sakuga", slug: "sakuga" },
    ])

    await expect(getCachedSitePage("about")).resolves.toEqual({
      content: { title: "About" },
      contentText: "About",
    })
    await expect(getCachedSearchTaxonomy()).resolves.toEqual({
      categories: [{ name: "Analysis", slug: "analysis" }],
      tags: [{ name: "Sakuga", slug: "sakuga" }],
    })

    expect(mocks.prisma.sitePage.findUnique).toHaveBeenCalledWith({
      select: { content: true, contentText: true },
      where: { slug: "about" },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["site-page"],
      options: { revalidate: 300, tags: ["site-pages"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["search-taxonomy"],
      options: { revalidate: 300, tags: ["categories", "tags"] },
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
    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      {
        authorId: "writer-1",
        coAuthors: [{ status: "PENDING", userId: "writer-2" }],
        commentCount: BigInt(3),
        id: "post-1",
        publishedAt: null,
        slug: "draft",
        status: "DRAFT",
        title: "Draft",
        updatedAt: new Date("2026-06-01T00:00:00Z"),
      },
    ])

    await expect(getCachedWriterDashboardPosts("writer-1")).resolves.toEqual([
      {
        _count: { comments: 3 },
        authorId: "writer-1",
        coAuthors: [{ status: "PENDING", userId: "writer-2" }],
        id: "post-1",
        publishedAt: null,
        slug: "draft",
        status: "DRAFT",
        title: "Draft",
        updatedAt: new Date("2026-06-01T00:00:00Z"),
      },
    ])

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.post.count).not.toHaveBeenCalled()
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["writer-dashboard-posts"],
      options: { revalidate: 60, tags: ["posts"] },
    })
  })

  it("excludes generated award-event final posts from writer dashboards", async () => {
    mocks.prisma.$queryRaw.mockResolvedValueOnce([])

    await getCachedWriterDashboardPosts("admin-1")

    const sql = flattenSql(mocks.prisma.$queryRaw.mock.calls[0])
    expect(sql).toMatch(
      /NOT EXISTS\s*\(\s*SELECT 1\s*FROM award_events event\s*WHERE event\."finalPostId" = p\.id\s*\)/,
    )
  })

  it("caches profile form data by user id behind the users tag", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      avatarOriginalUrl: "https://cdn.example.com/avatar-originals/writer.png",
      email: "writer@example.com",
      username: "writer",
    })

    await expect(getCachedProfileUser("writer-1")).resolves.toEqual({
      avatarOriginalUrl: "https://cdn.example.com/avatar-originals/writer.png",
      email: "writer@example.com",
      username: "writer",
    })

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      select: {
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
        removedPosts: BigInt(2),
        writers: BigInt(3),
      },
    ])

    await expect(getCachedAdminDashboardStats()).resolves.toEqual({
      activeSubscribers: 21,
      approvedComments: 12,
      archivedPosts: 1,
      draftPosts: 2,
      publishedPosts: 8,
      removedPosts: 2,
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
          authorRole: "ADMIN",
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
          authorRole: "ADMIN",
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

  it("defers admin post comment counts until after pagination for latest and oldest sorts", async () => {
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

    const [latestCall, oldestCall, commentsCall] = mocks.prisma.$queryRaw.mock.calls.map(
      (call) =>
        call
          .flatMap((value) => {
            if (
              typeof value === "object" &&
              value !== null &&
              "strings" in value &&
              Array.isArray(value.strings)
            ) {
              return value.strings.map(String)
            }

            return [String(value)]
          })
          .join("\n"),
    )

    expect(latestCall).toContain("JOIN paged p")
    expect(latestCall).toContain("WHERE c.\"postId\" = p.id")
    expect(latestCall).not.toContain("COUNT(c.id) AS \"commentCount\"")

    expect(oldestCall).toContain("JOIN paged p")
    expect(oldestCall).toContain("WHERE c.\"postId\" = p.id")
    expect(oldestCall).not.toContain("COUNT(c.id) AS \"commentCount\"")

    expect(commentsCall).toContain("COUNT(c.id) AS \"commentCount\"")
  })

  it("caches admin writer and newsletter data with matching tags", async () => {
    mocks.prisma.user.findMany.mockResolvedValue([{ username: "writer" }])
    mocks.prisma.invite.findMany.mockResolvedValue([{ email: "new@example.com" }])
    mocks.prisma.newsletterSubscriber.count.mockResolvedValue(42)
    mocks.prisma.newsletterBroadcast.count.mockResolvedValue(3)
    mocks.prisma.newsletterBroadcast.aggregate.mockResolvedValue({
      _sum: { sentCount: 28 },
    })
    mocks.prisma.newsletterBroadcast.findMany.mockResolvedValue([
      { id: "broadcast-1", status: "COMPLETED", subject: "Recent issue" },
    ])
    mocks.prisma.post.findMany.mockResolvedValue([{ title: "Recent essay" }])

    await expect(getCachedAdminWritersData()).resolves.toEqual({
      pendingInvites: [{ email: "new@example.com" }],
      writers: [{ username: "writer" }],
    })
    await expect(getCachedAdminNewsletterData()).resolves.toEqual({
      activeCount: 42,
      deliveredCount: 28,
      recentBroadcasts: [
        { id: "broadcast-1", status: "COMPLETED", subject: "Recent issue" },
      ],
      recentPosts: [{ title: "Recent essay" }],
      totalBroadcasts: 3,
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

  it("caches shared admin content and writer events data", async () => {
    mocks.prisma.category.findMany.mockResolvedValue([{ id: "category-1" }])
    mocks.prisma.tag.findMany.mockResolvedValue([{ id: "tag-1" }])
    mocks.prisma.post.findMany.mockResolvedValue([{ id: "post-1" }])
    mocks.prisma.comment.findMany.mockResolvedValue([{ id: "comment-1" }])
    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      {
        finalPost: { slug: "final-post" },
        id: "event-1",
        roomCount: BigInt(4),
        rooms: [{ id: "room-1", status: "DRAFT" }],
        status: "OPEN",
        title: "Open Event",
      },
    ])

    await expect(getCachedAdminContentData()).resolves.toEqual({
      categories: [{ id: "category-1" }],
      tags: [{ id: "tag-1" }],
    })
    await expect(getCachedWriterEvents("writer-1")).resolves.toEqual([
      {
        _count: { rooms: 4 },
        finalPost: { slug: "final-post" },
        id: "event-1",
        rooms: [{ id: "room-1", status: "DRAFT" }],
        status: "OPEN",
        title: "Open Event",
      },
    ])
    expect(mocks.prisma.awardEvent.findMany).not.toHaveBeenCalled()

    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["admin-content-data"],
      options: { revalidate: 60, tags: ["categories", "tags", "posts"] },
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
    mocks.prisma.$queryRaw.mockResolvedValueOnce([rawPostRow])

    await expect(getCachedCategoryBySlug("production")).resolves.toEqual({
      description: "Production essays",
      id: "category-1",
      name: "Production",
      slug: "production",
    })
    await expect(getCachedCategoryPosts("production", 2, 10, "comments")).resolves.toEqual({
      posts: [expect.objectContaining({ _count: { comments: 2 }, slug: "essay" })],
      total: 1,
    })

    expect(mocks.prisma.category.findUnique).toHaveBeenCalledWith({
      select: { description: true, id: true, name: true, slug: true },
      where: { slug: "production" },
    })
    expect(mocks.prisma.category.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.post.count).not.toHaveBeenCalled()
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["category-by-slug"],
      options: { revalidate: 300, tags: ["categories"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["category-posts"],
      options: { revalidate: 300, tags: ["posts", "categories"] },
    })
  })

  it("caches public tag entities and post lists", async () => {
    mocks.prisma.tag.findUnique.mockResolvedValue({
      id: "tag-1",
      name: "Sakuga",
      slug: "sakuga",
    })
    mocks.prisma.$queryRaw.mockResolvedValueOnce([rawPostRow])

    await expect(getCachedTagBySlug("sakuga")).resolves.toEqual({
      id: "tag-1",
      name: "Sakuga",
      slug: "sakuga",
    })
    await expect(getCachedTagPosts("sakuga", 1, 10, "oldest")).resolves.toEqual({
      posts: [expect.objectContaining({ _count: { comments: 2 }, slug: "essay" })],
      total: 1,
    })

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.post.count).not.toHaveBeenCalled()
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["tag-by-slug"],
      options: { revalidate: 300, tags: ["tags"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["tag-posts"],
      options: { revalidate: 300, tags: ["posts", "tags"] },
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
    mocks.prisma.$queryRaw.mockResolvedValueOnce([rawPostRow])

    await expect(getCachedAuthorByUsername("mina")).resolves.toEqual(
      expect.objectContaining({ id: "user-1", username: "mina" }),
    )
    await expect(getCachedAuthorPosts("mina", 1, 10, "comments")).resolves.toEqual({
      posts: [expect.objectContaining({ _count: { comments: 2 }, slug: "essay" })],
      total: 1,
    })

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.post.count).not.toHaveBeenCalled()
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["author-by-username"],
      options: { revalidate: 300, tags: ["users"] },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["author-posts"],
      options: { revalidate: 300, tags: ["posts", "users"] },
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
