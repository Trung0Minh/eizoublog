import { beforeEach, describe, expect, it, vi } from "vitest"

type PrismaCall = Record<string, unknown>

const mocks = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn(),
    commentEmailDelivery: { createMany: vi.fn() },
    comment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  }

  return {
    auth: vi.fn(),
    prisma,
    revalidateTag: vi.fn(),
    after: vi.fn(),
    processQueue: vi.fn(),
  }
})

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
  unstable_cache:
    <Args extends unknown[], Result>(fn: (...args: Args) => Result) =>
    (...args: Args) =>
      fn(...args),
}))
vi.mock("next/server", () => ({ after: mocks.after }))
vi.mock("@/lib/commentEmailQueue", () => ({ processCommentEmailQueue: mocks.processQueue }))

import { DELETE } from "@/app/api/comments/[id]/route"
import { POST } from "@/app/api/comments/route"

function jsonRequest(body: unknown) {
  return new Request("https://example.test/api/comments", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

const publishedPost = {
  author: {
    email: "mina@example.com",
    id: "user-1",
    name: "Mina",
  },
  coAuthors: [],
  finalAwardEvent: null,
  id: "post-1",
  slug: "frieren",
  title: "Frieren and memory",
}

const safeComment = {
  authorName: "Mina",
  content: "Thoughtful comment",
  createdAt: new Date("2024-04-01T00:00:00Z"),
  id: "comment-1",
  parentId: null,
  postId: "post-1",
  status: "APPROVED",
}

describe("comments API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.$transaction.mockImplementation((callback: (tx: typeof mocks.prisma) => Promise<unknown>) => callback(mocks.prisma))
    mocks.prisma.commentEmailDelivery.createMany.mockResolvedValue({ count: 1 })
    mocks.auth.mockResolvedValue(null)
    process.env.NEXT_PUBLIC_APP_URL = "https://animeblog.example"
  })

  it("creates an approved top-level comment without returning authorEmail", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(publishedPost)
    mocks.prisma.comment.create.mockResolvedValue(safeComment)

    const response = await POST(
      jsonRequest({
        authorEmail: "mina@example.com",
        authorName: "Mina",
        content: "Thoughtful comment",
        notifyReply: true,
        postId: "post-1",
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: {
        ...safeComment,
        createdAt: "2024-04-01T00:00:00.000Z",
      },
    })

    const createCall = mocks.prisma.comment.create.mock.calls[0]?.[0] as
      | PrismaCall
      | undefined
    expect(createCall?.data).toMatchObject({
      authorEmail: "mina@example.com",
      authorName: "Mina",
      content: "Thoughtful comment",
      parentId: null,
      postId: "post-1",
      status: "APPROVED",
    })
    expect(createCall?.select).not.toHaveProperty("authorEmail")
    expect(createCall?.select).toMatchObject({
      author: {
        select: {
          avatarUrl: true,
          displayRoleColor: true,
          displayRoleName: true,
        },
      },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("comments", "max")
    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      "post-detail:frieren",
      "max",
    )
  })

  it("returns the stored comment before starting notification delivery", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(publishedPost)
    mocks.prisma.comment.create.mockResolvedValue(safeComment)
    const response = await POST(jsonRequest({
      authorEmail: "reader@example.com", authorName: "Reader",
      content: "A queued notification", postId: "post-1",
    }))
    expect(response.status).toBe(201)
    expect(mocks.prisma.commentEmailDelivery.createMany).toHaveBeenCalledOnce()
    expect(mocks.processQueue).not.toHaveBeenCalled()
    const callback = mocks.after.mock.calls[0][0] as () => Promise<void>
    await callback()
    expect(mocks.processQueue).toHaveBeenCalledOnce()
  })

  it("still returns success if post-response scheduling fails after the transaction commits", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(publishedPost)
    mocks.prisma.comment.create.mockResolvedValue(safeComment)
    mocks.after.mockImplementationOnce(() => { throw new Error("scheduler unavailable") })
    const response = await POST(jsonRequest({
      authorEmail: "reader@example.com", authorName: "Reader",
      content: "A durable notification", postId: "post-1",
    }))
    expect(response.status).toBe(201)
    expect(mocks.prisma.commentEmailDelivery.createMany).toHaveBeenCalledOnce()
  })

  it("queues a reply notification to the parent author when enabled", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(publishedPost)
    mocks.prisma.comment.findUnique.mockResolvedValue({
      authorEmail: "parent@example.com",
      authorName: "Parent",
      id: "parent-1",
      notifyReply: true,
      parentId: null,
      postId: "post-1",
    })
    mocks.prisma.comment.create.mockResolvedValue({
      ...safeComment,
      id: "reply-1",
      parentId: "parent-1",
    })

    const response = await POST(
      jsonRequest({
        authorEmail: "reply@example.com",
        authorName: "Reply Writer",
        content: "I agree with this.",
        parentId: "parent-1",
        postId: "post-1",
      }),
    )

    expect(response.status).toBe(201)
    expect(mocks.prisma.commentEmailDelivery.createMany).toHaveBeenCalledWith({ data: expect.arrayContaining([expect.objectContaining({
      kind: "REPLY",
      postTitle: "Frieren and memory",
      postUrl: "https://animeblog.example/frieren#comment-reply-1",
      senderName: "Reply Writer",
      content: "I agree with this.",
      to: "parent@example.com",
      toName: "Parent",
    })]) })
  })

  it("queues emails for submitted event contributors as credited post authors", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      ...publishedPost,
      finalAwardEvent: {
        rooms: [
          {
            writer: {
              email: "event-writer@example.com",
              id: "writer-2",
              name: "Event Writer",
            },
          },
        ],
      },
    })
    mocks.prisma.comment.create.mockResolvedValue(safeComment)

    const response = await POST(
      jsonRequest({
        authorEmail: "reader@example.com",
        authorName: "Reader",
        content: "Thoughtful event comment",
        postId: "post-1",
      }),
    )

    expect(response.status).toBe(201)
    expect(mocks.prisma.commentEmailDelivery.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.objectContaining({
        kind: "POST_COMMENT", to: "mina@example.com", toName: "Mina",
      })]),
    })
    expect(mocks.prisma.commentEmailDelivery.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.objectContaining({
        kind: "POST_COMMENT", to: "event-writer@example.com", toName: "Event Writer",
      })]),
    })
  })

  it("does not send a reply notification when the author replies to themself", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(publishedPost)
    mocks.prisma.comment.findUnique.mockResolvedValue({
      authorEmail: "PARENT@example.com",
      authorName: "Parent",
      id: "parent-1",
      notifyReply: true,
      parentId: null,
      postId: "post-1",
    })
    mocks.prisma.comment.create.mockResolvedValue({
      ...safeComment,
      id: "reply-1",
      parentId: "parent-1",
    })

    const response = await POST(
      jsonRequest({
        authorEmail: "parent@example.com",
        authorName: "Parent",
        content: "Adding one more note.",
        parentId: "parent-1",
        postId: "post-1",
      }),
    )

    expect(response.status).toBe(201)
    expect(mocks.prisma.commentEmailDelivery.createMany).not.toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.objectContaining({ kind: "REPLY" })]),
    })
  })

  it.each([true, false])("deduplicates parent/author recipients with notifyReply=%s", async (notifyReply) => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      ...publishedPost,
      coAuthors: [{ user: { ...publishedPost.author, email: "MINA@example.com" } }],
    })
    mocks.prisma.comment.findUnique.mockResolvedValue({
      authorEmail: "mina@example.com", authorName: "Mina", id: "parent-1",
      notifyReply, parentId: null, postId: "post-1",
    })
    mocks.prisma.comment.create.mockResolvedValue({ ...safeComment, parentId: "parent-1" })
    const response = await POST(jsonRequest({
      authorEmail: "reader@example.com", authorName: "Reader",
      content: "Reply", parentId: "parent-1", postId: "post-1",
    }))
    expect(response.status).toBe(201)
    const queued = mocks.prisma.commentEmailDelivery.createMany.mock.calls[0][0].data
    expect(queued).toHaveLength(1)
    expect(queued[0].kind).toBe(notifyReply ? "REPLY" : "POST_COMMENT")
    expect(queued[0].to.toLowerCase()).toBe("mina@example.com")
  })

  it("rejects replies to replies", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(publishedPost)
    mocks.prisma.comment.findUnique.mockResolvedValue({
      authorEmail: "parent@example.com",
      authorName: "Parent",
      id: "reply-1",
      notifyReply: true,
      parentId: "parent-1",
      postId: "post-1",
    })

    const response = await POST(
      jsonRequest({
        authorEmail: "mina@example.com",
        authorName: "Mina",
        content: "Nested reply",
        parentId: "reply-1",
        postId: "post-1",
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Replies to replies are not allowed",
    })
    expect(mocks.prisma.comment.create).not.toHaveBeenCalled()
  })

  it("returns 404 when the post is not published", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(null)

    const response = await POST(
      jsonRequest({
        authorEmail: "mina@example.com",
        authorName: "Mina",
        content: "Draft comment",
        postId: "draft-post",
      }),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Post not found" })
  })
})

describe("comment admin API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue(null)
    mocks.prisma.user.findUnique.mockResolvedValue({
      avatarUrl: null,
      email: "admin@example.com",
      id: "admin-1",
      name: "Admin",
      role: "ADMIN",
      username: "admin",
    })
  })

  it("requires an admin to hide a comment", async () => {
    const response = await DELETE(
      new Request("https://example.test/api/comments/comment-1", {
        method: "DELETE",
      }),
      routeContext("comment-1"),
    )

    expect(response.status).toBe(401)
    expect(mocks.prisma.comment.update).not.toHaveBeenCalled()
  })

  it("soft-deletes a comment by marking it spam", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mocks.prisma.comment.findUnique.mockResolvedValue({
      id: "comment-1",
      post: { slug: "frieren" },
    })
    mocks.prisma.comment.update.mockResolvedValue({ id: "comment-1" })

    const response = await DELETE(
      new Request("https://example.test/api/comments/comment-1", {
        method: "DELETE",
      }),
      routeContext("comment-1"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Comment hidden" },
    })
    expect(mocks.prisma.comment.update).toHaveBeenCalledWith({
      data: { status: "SPAM" },
      where: { id: "comment-1" },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("comments", "max")
    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      "post-detail:frieren",
      "max",
    )
  })
})
