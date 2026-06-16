import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    comment: {
      count: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    postAuthor: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))

import {
  getNotificationCounts,
  getNotifications,
  markUnreadCommentsRead,
} from "@/lib/notifications"

describe("notification queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.comment.count.mockResolvedValue(0)
    mocks.prisma.comment.findMany.mockResolvedValue([])
    mocks.prisma.comment.updateMany.mockResolvedValue({ count: 0 })
    mocks.prisma.postAuthor.count.mockResolvedValue(0)
    mocks.prisma.postAuthor.findMany.mockResolvedValue([])
  })

  it("counts unread comments on authored and accepted co-authored posts", async () => {
    mocks.prisma.comment.count.mockResolvedValue(3)
    mocks.prisma.postAuthor.count.mockResolvedValue(2)

    await expect(
      getNotificationCounts({
        email: "mina@example.com",
        id: "writer-1",
      }),
    ).resolves.toEqual({ pendingInvites: 2, total: 5, unreadComments: 3 })

    expect(mocks.prisma.comment.count).toHaveBeenCalledWith({
      where: {
        authorEmail: { not: "mina@example.com" },
        isRead: false,
        post: {
          OR: [
            { authorId: "writer-1" },
            {
              coAuthors: {
                some: { status: "ACCEPTED", userId: "writer-1" },
              },
            },
          ],
          status: { not: "ARCHIVED" },
        },
        status: "APPROVED",
      },
    })
  })

  it("lists unread comments and pending co-author invites", async () => {
    const comment = {
      authorName: "Reader",
      content: "A thoughtful note about the scene.",
      createdAt: new Date("2026-06-16T04:00:00Z"),
      id: "comment-1",
      post: { slug: "essay", title: "Essay" },
    }
    const invite = {
      post: {
        author: { name: "Mina", username: "mina" },
        id: "post-1",
        slug: "draft",
        title: "Shared Draft",
        updatedAt: new Date("2026-06-16T03:00:00Z"),
      },
      postId: "post-1",
    }
    mocks.prisma.comment.findMany.mockResolvedValue([comment])
    mocks.prisma.postAuthor.findMany.mockResolvedValue([invite])

    await expect(
      getNotifications({
        email: "ken@example.com",
        id: "writer-2",
      }),
    ).resolves.toEqual({
      pendingInvites: [invite],
      unreadComments: [comment],
    })

    expect(mocks.prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    )
    expect(mocks.prisma.postAuthor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { post: { updatedAt: "desc" } },
      }),
    )
  })

  it("marks unread comments read across authored and accepted co-authored posts", async () => {
    mocks.prisma.comment.updateMany.mockResolvedValue({ count: 4 })

    await expect(
      markUnreadCommentsRead({
        email: "mina@example.com",
        id: "writer-1",
      }),
    ).resolves.toEqual({ count: 4 })

    expect(mocks.prisma.comment.updateMany).toHaveBeenCalledWith({
      data: { isRead: true },
      where: {
        authorEmail: { not: "mina@example.com" },
        isRead: false,
        post: {
          OR: [
            { authorId: "writer-1" },
            {
              coAuthors: {
                some: { status: "ACCEPTED", userId: "writer-1" },
              },
            },
          ],
          status: { not: "ARCHIVED" },
        },
        status: "APPROVED",
      },
    })
  })
})
