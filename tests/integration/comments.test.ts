import { beforeEach, describe, expect, it, vi } from "vitest"

type PrismaCall = Record<string, unknown>

const mocks = vi.hoisted(() => {
  const prisma = {
    comment: {
      create: vi.fn(),
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
    sendCommentReplyEmail: vi.fn(),
    sendPostCommentEmail: vi.fn(),
  }
})

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }))
vi.mock("@/lib/resend", () => ({
  sendCommentReplyEmail: mocks.sendCommentReplyEmail,
  sendPostCommentEmail: mocks.sendPostCommentEmail,
}))

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
        },
      },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("comments", "max")
  })

  it("sends a reply notification to the parent author when enabled", async () => {
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
    expect(mocks.sendCommentReplyEmail).toHaveBeenCalledWith({
      postTitle: "Frieren and memory",
      postUrl: "https://animeblog.example/frieren#comment-reply-1",
      repliedByName: "Reply Writer",
      replyContent: "I agree with this.",
      to: "parent@example.com",
      toName: "Parent",
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
    expect(mocks.sendCommentReplyEmail).not.toHaveBeenCalled()
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
    mocks.prisma.comment.findUnique.mockResolvedValue({ id: "comment-1" })
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
  })
})
