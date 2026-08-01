import { beforeEach, describe, expect, it, vi } from "vitest"

type PrismaCall = Record<string, unknown>

const mocks = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn(),
    post: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    postAuditEvent: { create: vi.fn() },
    postRevision: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    mediaCleanupJob: { create: vi.fn() },
    tag: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    notification: {
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    postAuthor: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    postTag: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    awardEventRoom: {
      findFirst: vi.fn(),
    },
  }

  return {
    auth: vi.fn(),
    prisma,
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
  }
})

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
  unstable_cache: (fn: unknown) => fn,
}))

import { DELETE, GET as GET_POST, PATCH } from "@/app/api/posts/[id]/route"
import { POST as WITHDRAW_CO_AUTHOR } from "@/app/api/posts/[id]/co-authors/withdraw/route"
import { GET as GET_POSTS, POST as CREATE_POST } from "@/app/api/posts/route"
import { GET as GET_TAGS, POST as CREATE_TAG } from "@/app/api/tags/route"

function jsonRequest(url: string, body: unknown, method = "POST") {
  return new Request(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  })
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe("posts API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.postTag.findMany.mockResolvedValue([])
    mocks.prisma.user.findMany.mockResolvedValue([{ id: "admin-1" }])
    mocks.auth.mockResolvedValue(null)
    mocks.prisma.user.findUnique.mockImplementation(async (query: unknown) => {
      const where =
        typeof query === "object" && query !== null && "where" in query
          ? query.where
          : null
      const id =
        typeof where === "object" &&
        where !== null &&
        "id" in where &&
        typeof where.id === "string"
          ? where.id
          : null

      if (id === "admin-1") {
        return {
          avatarUrl: null,
          email: "admin@example.com",
          id,
          name: "Admin",
          role: "ADMIN",
          username: "admin",
        }
      }

      if (id === "writer-1" || id === "writer-2") {
        return {
          avatarUrl: null,
          email: `${id}@example.com`,
          id,
          name: "Writer",
          role: "WRITER",
          username: id,
        }
      }

      return null
    })
    mocks.prisma.$transaction.mockImplementation(async (input) => {
      if (Array.isArray(input)) {
        return Promise.all(input)
      }

      if (typeof input === "function") {
        return input(mocks.prisma)
      }

      throw new Error("Unsupported transaction input")
    })
  })

  it("lists only published posts for visitors with private author fields excluded", async () => {
    mocks.prisma.post.findMany.mockResolvedValue([
      {
        _count: { comments: 0 },
        author: { id: "writer-1", name: "Mina", username: "mina" },
        coAuthors: [],
        id: "post-1",
        slug: "frieren",
        status: "PUBLISHED",
        tags: [],
        title: "Frieren",
      },
    ])
    mocks.prisma.post.count.mockResolvedValue(1)

    const response = await GET_POSTS(
      new Request("https://example.test/api/posts?page=2&limit=5"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: {
        pagination: { limit: 5, page: 2, total: 1, totalPages: 1 },
        posts: [{ slug: "frieren" }],
      },
    })
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        where: { status: "PUBLISHED" },
      }),
    )

    const call = mocks.prisma.post.findMany.mock.calls[0]?.[0] as PrismaCall
    const select = call.select as { author: { select: Record<string, boolean> } }
    expect(select.author.select).not.toHaveProperty("email")
  })

  it("lists published posts, own drafts, and shared co-author drafts for authenticated writers", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.post.findMany.mockResolvedValue([])
    mocks.prisma.post.count.mockResolvedValue(0)

    await GET_POSTS(new Request("https://example.test/api/posts"))

    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { status: "PUBLISHED" },
            { authorId: "writer-1", status: "DRAFT" },
            {
              coAuthors: { some: { status: "ACCEPTED", userId: "writer-1" } },
              status: "DRAFT",
            },
          ],
        },
      }),
    )
  })

  it("lets admins list archived posts explicitly", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    mocks.prisma.post.findMany.mockResolvedValue([])
    mocks.prisma.post.count.mockResolvedValue(0)

    const response = await GET_POSTS(
      new Request("https://example.test/api/posts?status=ARCHIVED"),
    )

    expect(response.status).toBe(200)
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "ARCHIVED" },
      }),
    )
  })

  it("creates a post with a unique slug for authenticated writers", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.post.findUnique
      .mockResolvedValueOnce({ id: "existing-post" })
      .mockResolvedValueOnce(null)
    mocks.prisma.post.create.mockResolvedValue({
      id: "post-1",
      slug: "my-title-1",
      status: "PUBLISHED",
    })

    const response = await CREATE_POST(
      jsonRequest("https://example.test/api/posts", {
        categoryId: "category-1",
        coAuthorIds: ["writer-2"],
        content: { content: [], type: "doc" },
        contentText: "Plain content",
        excerpt: "Short summary",
        status: "PUBLISHED",
        tagIds: ["tag-1"],
        title: "My Title",
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { id: "post-1", slug: "my-title-1", status: "PUBLISHED" },
    })
    expect(mocks.prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          author: { connect: { id: "writer-1" } },
          category: { connect: { id: "category-1" } },
          coAuthors: {
            create: [{ order: 0, user: { connect: { id: "writer-2" } } }],
          },
          publishedAt: expect.any(Date),
          slug: "my-title-1",
          tags: {
            create: [{ tag: { connect: { id: "tag-1" } } }],
          },
        }),
        select: {
          id: true,
          lastSavedAt: true,
          slug: true,
          status: true,
          version: true,
        },
      }),
    )
    expect(mocks.revalidateTag).toHaveBeenCalledWith("posts", "max")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/my-title-1")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/posts")
  })

  it("rejects published post creation if contentText is empty", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })

    const response = await CREATE_POST(
      jsonRequest("https://example.test/api/posts", {
        content: { content: [], type: "doc" },
        contentText: "",
        status: "PUBLISHED",
        title: "My Title",
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Nội dung bài viết không được để trống khi đăng.",
    })
  })

  it("rejects unauthenticated post creation", async () => {
    const response = await CREATE_POST(
      jsonRequest("https://example.test/api/posts", {
        content: { content: [], type: "doc" },
        title: "Draft",
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })
})

describe("single post API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue(null)
    mocks.prisma.user.findUnique.mockImplementation(async (query: unknown) => {
      const where =
        typeof query === "object" && query !== null && "where" in query
          ? query.where
          : null
      const id =
        typeof where === "object" &&
        where !== null &&
        "id" in where &&
        typeof where.id === "string"
          ? where.id
          : null

      if (id === "admin-1") {
        return {
          avatarUrl: null,
          email: "admin@example.com",
          id,
          name: "Admin",
          role: "ADMIN",
          username: "admin",
        }
      }

      if (id === "writer-1" || id === "writer-2") {
        return {
          avatarUrl: null,
          email: `${id}@example.com`,
          id,
          name: "Writer",
          role: "WRITER",
          username: id,
        }
      }

      return null
    })
    mocks.prisma.$transaction.mockImplementation(async (input) => {
      if (typeof input === "function") {
        return input(mocks.prisma)
      }

      if (Array.isArray(input)) {
        return Promise.all(input)
      }

      throw new Error("Unsupported transaction input")
    })
  })

  it("hides drafts from visitors", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [],
      draftVisibility: "PRIVATE",
      id: "post-1",
      status: "DRAFT",
    })

    const response = await GET_POST(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Post not found" })
  })

  it("hides private drafts from listed co-authors", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [{ userId: "writer-2" }],
      draftVisibility: "PRIVATE",
      id: "post-1",
      status: "DRAFT",
    })

    const response = await GET_POST(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Post not found" })
  })

  it("returns shared drafts to listed co-authors", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [{ status: "ACCEPTED", userId: "writer-2" }],
      draftVisibility: "CO_AUTHORS",
      id: "post-1",
      status: "DRAFT",
      title: "Shared Draft",
    })

    const response = await GET_POST(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: "post-1", status: "DRAFT", title: "Shared Draft" },
    })
  })

  it("allows event participants to view shared draft previews", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [],
      draftVisibility: "PRIVATE",
      id: "post-1",
      status: "DRAFT",
      title: "Shared Event Draft",
    })
    mocks.prisma.awardEventRoom.findFirst.mockResolvedValue({ id: "room-1" })

    const response = await GET_POST(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: { id: "post-1", status: "DRAFT", title: "Shared Event Draft" },
    })
    expect(mocks.prisma.awardEventRoom.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: {
        postId: "post-1",
        visibility: "PARTICIPANTS",
        event: {
          rooms: {
            some: {
              writerId: "writer-2",
            },
          },
        },
      },
    })
  })

  it("hides shared draft previews if requester is not in the same event", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [],
      draftVisibility: "PRIVATE",
      id: "post-1",
      status: "DRAFT",
    })
    mocks.prisma.awardEventRoom.findFirst.mockResolvedValue(null)

    const response = await GET_POST(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Post not found" })
  })

  it("hides archived posts from visitors and writers while allowing admins", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [{ userId: "writer-2" }],
      draftVisibility: "CO_AUTHORS",
      id: "post-1",
      status: "ARCHIVED",
      title: "Archived post",
    })

    const visitorResponse = await GET_POST(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(visitorResponse.status).toBe(404)

    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    const writerResponse = await GET_POST(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(writerResponse.status).toBe(404)

    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    const adminResponse = await GET_POST(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(adminResponse.status).toBe(200)
    await expect(adminResponse.json()).resolves.toMatchObject({
      data: { id: "post-1", status: "ARCHIVED", title: "Archived post" },
    })
  })

  it("publishes an owned draft and replaces tags in one update", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      authorId: "writer-1",
      status: "DRAFT",
      contentText: "Nội dung bài viết",
      version: 1,
    })
    mocks.prisma.postTag.findMany.mockResolvedValue([
      { tagId: "tag-1", postId: "post-1" },
    ])
    mocks.prisma.post.update.mockResolvedValue({
      id: "post-1",
      slug: "draft-title",
      status: "PUBLISHED",
      updatedAt: new Date("2024-04-01T00:00:00Z"),
      version: 2,
    })

    const response = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        {
          baseVersion: 1,
          status: "PUBLISHED",
          tagIds: ["tag-2"],
        },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(response.status).toBe(200)
    expect(mocks.prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publishedAt: expect.any(Date),
          status: "PUBLISHED",
        }),
        where: { id: "post-1", version: 1 },
      }),
    )
    expect(mocks.prisma.postTag.deleteMany).toHaveBeenCalledWith({
      where: {
        postId: "post-1",
        tagId: { in: ["tag-1"] },
      },
    })
    expect(mocks.prisma.postTag.createMany).toHaveBeenCalledWith({
      data: [{ postId: "post-1", tagId: "tag-2" }],
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("posts", "max")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/draft-title")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/posts")
  })

  it("allows a writer to publish a moderation-unpublished draft", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      categoryId: null,
      coAuthors: [],
      content: { content: [], type: "doc" },
      contentText: "Saved body",
      coverAlt: null,
      coverUrl: null,
      draftVisibility: "PRIVATE",
      excerpt: null,
      excerptContent: null,
      id: "post-1",
      moderationLockedAt: new Date("2026-08-01T00:00:00.000Z"),
      publishedAt: null,
      removedAt: null,
      removedFromStatus: null,
      slug: "locked-post",
      status: "DRAFT",
      tags: [],
      title: "Locked post",
      version: 7,
    })
    mocks.prisma.post.update.mockResolvedValue({
      id: "post-1",
      lastSavedAt: new Date("2026-08-01T00:01:00.000Z"),
      slug: "locked-post",
      status: "PUBLISHED",
      updatedAt: new Date("2026-08-01T00:01:00.000Z"),
      version: 8,
    })

    const response = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        {
          baseVersion: 7,
          content: { content: [{ text: "Updated body", type: "text" }], type: "doc" },
          contentText: "Updated body",
          status: "PUBLISHED",
          title: "Updated locked post",
        },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: {
        id: "post-1",
        slug: "locked-post",
        status: "PUBLISHED",
        version: 8,
      },
    })
    expect(mocks.prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          moderationLockedAt: null,
          removedFromStatus: null,
          status: "PUBLISHED",
        }),
      }),
    )
  })

  it("rejects publishing an owned draft if contentText is empty", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      authorId: "writer-1",
      status: "DRAFT",
      version: 1,
      contentText: "",
    })

    const response = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        {
          status: "PUBLISHED",
        },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Nội dung bài viết không được để trống khi đăng.",
    })
  })

  it("lets post authors withdraw published posts to drafts", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [],
      status: "PUBLISHED",
    })
    mocks.prisma.post.update.mockResolvedValue({
      id: "post-1",
      slug: "published-post",
      status: "DRAFT",
      updatedAt: new Date("2026-06-16T00:00:00Z"),
    })

    const response = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        { status: "DRAFT" },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(response.status).toBe(200)
    expect(mocks.prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publishedAt: null,
          status: "DRAFT",
        }),
        where: { id: "post-1" },
      }),
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/published-post")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/posts")
  })

  it("lets post authors archive their own posts from the dashboard", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [],
      status: "PUBLISHED",
    })
    mocks.prisma.post.update.mockResolvedValue({
      id: "post-1",
      slug: "published-post",
      status: "ARCHIVED",
      updatedAt: new Date("2026-06-16T00:00:00Z"),
    })

    const response = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        { status: "ARCHIVED" },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(response.status).toBe(200)
    expect(mocks.prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publishedAt: null,
          status: "ARCHIVED",
        }),
        where: { id: "post-1" },
      }),
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/published-post")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/posts")
  })

  it("forbids accepted co-authors from withdrawing or archiving posts", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [{ status: "ACCEPTED", userId: "writer-2" }],
      status: "PUBLISHED",
    })

    const withdrawResponse = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        { status: "DRAFT" },
        "PATCH",
      ),
      routeContext("post-1"),
    )
    const archiveResponse = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        { status: "ARCHIVED" },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(withdrawResponse.status).toBe(403)
    expect(archiveResponse.status).toBe(403)
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })

  it("forbids accepted co-authors from publishing posts", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [{ status: "ACCEPTED", userId: "writer-2" }],
      contentText: "Ready to publish",
      status: "DRAFT",
      version: 1,
    })

    mocks.auth.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    const response = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        { status: "PUBLISHED" },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(response.status).toBe(403)
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()

    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    const adminCoAuthorResponse = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        { status: "PUBLISHED" },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(adminCoAuthorResponse.status).toBe(403)
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })

  it("lets accepted co-authors withdraw their own post access", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.postAuthor.findUnique.mockResolvedValue({
      post: { authorId: "writer-1" },
      status: "ACCEPTED",
    })
    mocks.prisma.postAuthor.delete.mockResolvedValue({
      postId: "post-1",
      userId: "writer-2",
    })

    const response = await WITHDRAW_CO_AUTHOR(
      new Request("https://example.test/api/posts/post-1/co-authors/withdraw", {
        method: "POST",
      }),
      routeContext("post-1"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { success: true },
    })
    expect(mocks.prisma.postAuthor.delete).toHaveBeenCalledWith({
      where: {
        postId_userId: {
          postId: "post-1",
          userId: "writer-2",
        },
      },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("posts", "max")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard")
  })

  it("updates draft visibility and records autosave timestamps", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      status: "DRAFT",
      version: 1,
    })
    mocks.prisma.post.update.mockResolvedValue({
      id: "post-1",
      slug: "draft-title",
      status: "DRAFT",
      updatedAt: new Date("2024-04-01T00:00:00Z"),
      version: 2,
    })

    const response = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        {
          baseVersion: 1,
          content: { content: [], type: "doc" },
          contentText: "Autosaved body",
          draftVisibility: "CO_AUTHORS",
          excerpt: "Autosaved excerpt",
          title: "Autosaved title",
        },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(response.status).toBe(200)
    expect(mocks.prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          draftVisibility: "CO_AUTHORS",
          lastSavedAt: expect.any(Date),
        }),
        where: { id: "post-1", version: 1 },
      }),
    )
    expect(mocks.revalidateTag).not.toHaveBeenCalledWith("posts", "max")
  })

  it("rejects a stale post version without overwriting newer content", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [],
      contentText: "Newer server content",
      id: "post-1",
      moderationLockedAt: null,
      slug: "draft-title",
      status: "DRAFT",
      title: "Draft title",
      version: 4,
    })

    const response = await PATCH(
      jsonRequest(
        "https://example.test/api/posts/post-1",
        {
          baseVersion: 3,
          content: { content: [], type: "doc" },
          contentText: "Stale local content",
          title: "Draft title",
        },
        "PATCH",
      ),
      routeContext("post-1"),
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: "Post changed in another session. Your local copy was preserved.",
    })
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })

  it("forbids writers from permanently deleting posts", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      slug: "published-post",
    })

    const response = await DELETE(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(mocks.prisma.post.delete).not.toHaveBeenCalled()
  })

  it("forbids accepted co-authors from permanently deleting posts", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [{ status: "ACCEPTED", userId: "writer-2" }],
    })

    const response = await DELETE(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(mocks.prisma.post.delete).not.toHaveBeenCalled()
  })

  it("requires admins to provide a permanent deletion confirmation", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    const response = await DELETE(
      new Request("https://example.test/api/posts/post-1"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Type the post title to confirm deletion",
    })
    expect(mocks.prisma.post.delete).not.toHaveBeenCalled()
  })

  it("rejects legacy archive requests that omit a moderation reason", async () => {
    const { POST: ARCHIVE_POST } = await import(
      "@/app/api/posts/[id]/archive/route"
    )
    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      slug: "published-post",
      status: "PUBLISHED",
    })
    mocks.prisma.post.update.mockResolvedValue({
      id: "post-1",
      status: "ARCHIVED",
    })

    const response = await ARCHIVE_POST(
      new Request("https://example.test/api/posts/post-1/archive"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({
      error: "A moderation reason is required. Use the admin moderation endpoint.",
    })
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })

  it("rejects legacy restore requests that omit a moderation reason", async () => {
    const { DELETE: RESTORE_POST } = await import(
      "@/app/api/posts/[id]/archive/route"
    )
    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      slug: "published-post",
      status: "ARCHIVED",
    })
    mocks.prisma.post.update.mockResolvedValue({
      id: "post-1",
      status: "DRAFT",
    })

    const response = await RESTORE_POST(
      new Request("https://example.test/api/posts/post-1/archive"),
      routeContext("post-1"),
    )

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({
      error: "A moderation reason is required. Use the admin moderation endpoint.",
    })
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })
})

describe("tags API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue(null)
    mocks.prisma.user.findUnique.mockImplementation(async (query: unknown) => {
      const where =
        typeof query === "object" && query !== null && "where" in query
          ? query.where
          : null
      const id =
        typeof where === "object" &&
        where !== null &&
        "id" in where &&
        typeof where.id === "string"
          ? where.id
          : null

      if (id === "writer-1") {
        return {
          avatarUrl: null,
          email: "writer@example.com",
          id,
          name: "Writer",
          role: "WRITER",
          username: "writer",
        }
      }

      return null
    })
  })

  it("searches matching tags for autocomplete", async () => {
    mocks.prisma.tag.findMany.mockResolvedValue([
      { id: "tag-1", name: "Sakuga", slug: "sakuga" },
    ])

    const response = await GET_TAGS(
      new Request("https://example.test/api/tags?q=saku"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: [{ id: "tag-1", name: "Sakuga", slug: "sakuga" }],
    })
    expect(mocks.prisma.tag.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
      take: 20,
      where: { name: { contains: "saku", mode: "insensitive" } },
    })
  })

  it("creates a tag by slug or returns the existing one", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.tag.upsert.mockResolvedValue({
      id: "tag-1",
      name: "Đạo diễn",
      slug: "dao-dien",
    })

    const response = await CREATE_TAG(
      jsonRequest("https://example.test/api/tags", { name: "Đạo diễn" }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { id: "tag-1", name: "Đạo diễn", slug: "dao-dien" },
    })
    expect(mocks.prisma.tag.upsert).toHaveBeenCalledWith({
      create: { name: "Đạo diễn", slug: "dao-dien" },
      select: { id: true, name: true, slug: true },
      update: {},
      where: { slug: "dao-dien" },
    })
  })
})

describe("bulk post API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
  })

  it("requires admin authentication for bulk moderation", async () => {
    const { POST: BULK_POST } = await import("@/app/api/posts/bulk/route")
    mocks.auth.mockResolvedValue(null)

    const response = await BULK_POST(
      jsonRequest("https://example.test/api/posts/bulk", {
        action: "REMOVE",
        postIds: ["post-1", "post-2"],
        reason: "Policy review required.",
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(mocks.prisma.post.deleteMany).not.toHaveBeenCalled()
  })

  it("rejects invalid bulk moderation actions", async () => {
    const { POST: BULK_POST } = await import("@/app/api/posts/bulk/route")

    const response = await BULK_POST(
      jsonRequest("https://example.test/api/posts/bulk", {
        action: "BAD_ACTION",
        postIds: ["post-1"],
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid request" })
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
    expect(mocks.revalidateTag).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
})
