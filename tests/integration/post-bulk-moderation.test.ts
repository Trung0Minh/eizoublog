import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const tx = {
    notification: { create: vi.fn() },
    post: { findMany: vi.fn(), update: vi.fn() },
  }

  return {
    auth: vi.fn(),
    prisma: { $transaction: vi.fn() },
    revalidate: vi.fn(),
    tx,
  }
})

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/postRevalidation", () => ({
  revalidatePostMutationPaths: mocks.revalidate,
}))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))

import { POST } from "@/app/api/posts/bulk/route"

function request(body: unknown) {
  return new Request("https://example.test/api/posts/bulk", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

describe("POST /api/posts/bulk moderation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", name: "Admin", role: "ADMIN" },
    })
    mocks.prisma.$transaction.mockImplementation(
      (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx),
    )
    mocks.tx.post.findMany.mockResolvedValue([
      {
        authorId: "writer-1",
        contentText: "First body",
        id: "post-1",
        removedFromStatus: null,
        slug: "first",
        status: "PUBLISHED",
        title: "First",
      },
      {
        authorId: "writer-2",
        contentText: "Second body",
        id: "post-2",
        removedFromStatus: null,
        slug: "second",
        status: "DRAFT",
        title: "Second",
      },
    ])
    mocks.tx.post.update.mockImplementation(({ data, where }: { data: { status: string }; where: { id: string } }) =>
      Promise.resolve({ id: where.id, status: data.status }),
    )
    mocks.tx.notification.create.mockResolvedValue({ id: "notification-1" })
  })

  it("updates every selected post and notification in one transaction", async () => {
    const response = await POST(request({
      action: "REMOVE",
      postIds: ["post-1", "post-2"],
      reason: "Policy review required.",
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        posts: [
          { id: "post-1", status: "REMOVED" },
          { id: "post-2", status: "REMOVED" },
        ],
      },
    })
    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(mocks.tx.post.update).toHaveBeenCalledTimes(2)
    expect(mocks.tx.notification.create).toHaveBeenCalledTimes(2)
    expect(mocks.tx.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        data: expect.objectContaining({
          action: "REMOVE",
          reason: "Policy review required.",
        }),
        type: "POST_MODERATION",
        userId: "writer-1",
      }),
    })
    expect(mocks.revalidate).toHaveBeenCalledWith(["first", "second"])
  })

  it("validates every transition before writing, preventing partial success", async () => {
    mocks.tx.post.findMany.mockResolvedValue([
      {
        authorId: "writer-1",
        contentText: "Body",
        id: "post-1",
        removedFromStatus: null,
        slug: "first",
        status: "PUBLISHED",
        title: "First",
      },
      {
        authorId: "writer-2",
        contentText: "Body",
        id: "post-2",
        removedFromStatus: "DRAFT",
        slug: "second",
        status: "REMOVED",
        title: "Second",
      },
    ])

    const response = await POST(request({
      action: "ARCHIVE",
      postIds: ["post-1", "post-2"],
      reason: "Archive after review.",
    }))

    expect(response.status).toBe(409)
    expect(mocks.tx.post.update).not.toHaveBeenCalled()
    expect(mocks.tx.notification.create).not.toHaveBeenCalled()
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })

  it("rejects missing reasons and oversized batches", async () => {
    const missingReason = await POST(request({
      action: "REMOVE",
      postIds: ["post-1"],
      reason: "",
    }))
    const oversized = await POST(request({
      action: "REMOVE",
      postIds: Array.from({ length: 101 }, (_, index) => `post-${index}`),
      reason: "Policy review required.",
    }))

    expect(missingReason.status).toBe(400)
    expect(oversized.status).toBe(400)
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })
})
