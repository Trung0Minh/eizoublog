import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  revalidate: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    notification: { create: vi.fn() },
    post: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}))
vi.mock("@/lib/postRevalidation", () => ({
  revalidatePostMutationPaths: mocks.revalidate,
}))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))

import { POST } from "@/app/api/admin/posts/[id]/moderation/route"

function request(action: string, reason: string) {
  return new Request("https://example.test/api/admin/posts/post-1/moderation", {
    body: JSON.stringify({ action, reason }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

describe("POST /api/admin/posts/[id]/moderation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "admin-1", name: "Admin", role: "ADMIN" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      contentText: "Essay body",
      id: "post-1",
      moderationLockedAt: null,
      removedFromStatus: null,
      slug: "essay",
      status: "PUBLISHED",
      title: "Essay",
    })
    mocks.prisma.post.update.mockResolvedValue({
      id: "post-1",
      slug: "essay",
      status: "DRAFT",
    })
    mocks.prisma.notification.create.mockResolvedValue({ id: "notification-1" })
    mocks.prisma.$transaction.mockImplementation((operations: unknown) =>
      Promise.resolve(operations),
    )
  })

  it("requires an authenticated admin", async () => {
    mocks.getActiveSession.mockResolvedValue(null)

    const response = await POST(request("UNPUBLISH", "Needs sources"), {
      params: Promise.resolve({ id: "post-1" }),
    })

    expect(response.status).toBe(401)
  })

  it("requires a meaningful moderation reason", async () => {
    const response = await POST(request("UNPUBLISH", "  "), {
      params: Promise.resolve({ id: "post-1" }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid request" })
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })

  it("unpublishes without locking the post and notifies its author with the reason", async () => {
    const response = await POST(request("UNPUBLISH", "Please add sources."), {
      params: Promise.resolve({ id: "post-1" }),
    })

    expect(response.status).toBe(200)
    expect(mocks.prisma.post.update).toHaveBeenCalledWith({
      data: {
        featuredAt: null,
        moderationLockedAt: null,
        publishedAt: null,
        removedFromStatus: null,
        status: "DRAFT",
      },
      select: { id: true, slug: true, status: true },
      where: { id: "post-1" },
    })
    expect(mocks.prisma.notification.create).toHaveBeenCalledWith({
      data: {
        data: {
          action: "UNPUBLISH",
          actorName: "Admin",
          fromStatus: "PUBLISHED",
          postId: "post-1",
          postSlug: "essay",
          postTitle: "Essay",
          reason: "Please add sources.",
          toStatus: "DRAFT",
        },
        type: "POST_MODERATION",
        userId: "writer-1",
      },
    })
  })

  it("soft-removes a post and restores its previous status with reasons", async () => {
    const removeResponse = await POST(request("REMOVE", "Policy violation."), {
      params: Promise.resolve({ id: "post-1" }),
    })
    expect(removeResponse.status).toBe(200)
    expect(mocks.prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          removedFromStatus: "PUBLISHED",
          status: "REMOVED",
        }),
      }),
    )

    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      contentText: "Essay body",
      id: "post-1",
      moderationLockedAt: new Date(),
      removedFromStatus: "PUBLISHED",
      slug: "essay",
      status: "REMOVED",
      title: "Essay",
    })
    await POST(request("RESTORE_REMOVED", "Review completed."), {
      params: Promise.resolve({ id: "post-1" }),
    })
    expect(mocks.prisma.post.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          moderationLockedAt: null,
          removedFromStatus: null,
          status: "PUBLISHED",
        }),
      }),
    )
  })

  it("rejects transitions that do not match the current status", async () => {
    const response = await POST(request("PUBLISH", "Ready again."), {
      params: Promise.resolve({ id: "post-1" }),
    })

    expect(response.status).toBe(409)
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })

  it("does not publish an empty draft", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      contentText: "   ",
      id: "post-1",
      moderationLockedAt: new Date(),
      removedFromStatus: null,
      slug: "essay",
      status: "DRAFT",
      title: "Essay",
    })

    const response = await POST(request("PUBLISH", "Ready again."), {
      params: Promise.resolve({ id: "post-1" }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Post content cannot be empty when publishing",
    })
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })
})
