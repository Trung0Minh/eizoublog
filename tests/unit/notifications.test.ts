import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
    awardEventRoomComment: {
      updateMany: vi.fn(),
    },
    comment: {
      count: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    postAuthor: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))

import {
  createCoAuthorResponseNotification,
  getNotificationCounts,
  getNotifications,
  markEventRoomCommentRead,
  markEventRoomCommentUnread,
  markUnreadCommentsRead,
  markNotificationsRead,
  markCommentRead,
  markCommentUnread,
  markNotificationRead,
  markNotificationUnread,
} from "@/lib/notifications"

describe("notification queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.$queryRaw.mockResolvedValue([])
    mocks.prisma.awardEventRoomComment.updateMany.mockResolvedValue({ count: 0 })
    mocks.prisma.comment.count.mockResolvedValue(0)
    mocks.prisma.comment.findMany.mockResolvedValue([])
    mocks.prisma.comment.updateMany.mockResolvedValue({ count: 0 })
    mocks.prisma.notification.count.mockResolvedValue(0)
    mocks.prisma.notification.create.mockResolvedValue({ id: "notification-1" })
    mocks.prisma.notification.findMany.mockResolvedValue([])
    mocks.prisma.notification.updateMany.mockResolvedValue({ count: 0 })
    mocks.prisma.postAuthor.count.mockResolvedValue(0)
    mocks.prisma.postAuthor.findMany.mockResolvedValue([])
  })

  it("counts unread comments on authored and accepted co-authored posts", async () => {
    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      {
        pendingInvites: BigInt(2),
        responseEvents: BigInt(4),
        unreadComments: BigInt(3),
        unreadEventRoomComments: BigInt(1),
      },
    ])

    await expect(
      getNotificationCounts({
        email: "mina@example.com",
        id: "writer-1",
      }),
    ).resolves.toEqual({
      pendingInvites: 2,
      responseEvents: 4,
      total: 10,
      unreadComments: 4,
    })

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.prisma.comment.count).not.toHaveBeenCalled()
    expect(mocks.prisma.postAuthor.count).not.toHaveBeenCalled()
    expect(mocks.prisma.notification.count).not.toHaveBeenCalled()
  })

  it("lists unread comments and pending co-author invites", async () => {
    const comment = {
      authorName: "Reader",
      content: "A thoughtful note about the scene.",
      createdAt: new Date("2026-06-16T04:00:00Z"),
      id: "comment-1",
      isRead: false,
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
    const responseEvent = {
      createdAt: new Date("2026-06-16T05:00:00Z"),
      data: {
        actorName: "Ken",
        postId: "post-1",
        postTitle: "Shared Draft",
      },
      id: "notification-1",
      type: "COAUTHOR_ACCEPTED",
    }
    const eventRoomComment = {
      author: { name: "Admin", username: "admin" },
      content: "Please tighten this paragraph.",
      createdAt: new Date("2026-06-16T06:00:00Z"),
      event: { id: "event-1", title: "Awards" },
      id: "event-comment-1",
      isRead: false,
      room: { id: "room-1", title: "Submission" },
    }
    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      {
        pendingInvites: [invite],
        responseEvents: [responseEvent],
        unreadComments: [comment, eventRoomComment],
      },
    ])

    await expect(
      getNotifications({
        email: "ken@example.com",
        id: "writer-2",
      }),
    ).resolves.toEqual({
      pendingInvites: [invite],
      responseEvents: [responseEvent],
      unreadComments: [comment, eventRoomComment],
    })

    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    const sql = String(mocks.prisma.$queryRaw.mock.calls[0]?.[0])
    expect(sql).not.toMatch(
      /(?:c|p|pa)\.status::text\s*(?:=|<>|IN)/,
    )
    expect(mocks.prisma.comment.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.postAuthor.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.notification.findMany).not.toHaveBeenCalled()
  })

  it("marks unread comments read across authored and accepted co-authored posts", async () => {
    mocks.prisma.comment.updateMany.mockResolvedValue({ count: 4 })
    mocks.prisma.awardEventRoomComment.updateMany.mockResolvedValue({ count: 2 })

    await expect(
      markUnreadCommentsRead({
        email: "mina@example.com",
        id: "writer-1",
      }),
    ).resolves.toEqual({ count: 6 })

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
          status: { notIn: ["ARCHIVED", "REMOVED"] },
        },
        status: "APPROVED",
      },
    })
    expect(mocks.prisma.awardEventRoomComment.updateMany).toHaveBeenCalledWith({
      data: { isRead: true },
      where: {
        authorId: { not: "writer-1" },
        isRead: false,
        room: { writerId: "writer-1" },
      },
    })
  })

  it("marks durable response notifications read", async () => {
    mocks.prisma.notification.updateMany.mockResolvedValue({ count: 2 })

    await expect(markNotificationsRead("writer-1")).resolves.toEqual({
      count: 2,
    })

    expect(mocks.prisma.notification.updateMany).toHaveBeenCalledWith({
      data: { readAt: expect.any(Date) },
      where: { readAt: null, userId: "writer-1" },
    })
  })

  it("marks a single unread comment read if authorized", async () => {
    mocks.prisma.comment.updateMany.mockResolvedValue({ count: 1 })

    await expect(
      markCommentRead("comment-123", {
        email: "mina@example.com",
        id: "writer-1",
      }),
    ).resolves.toEqual({ count: 1 })

    expect(mocks.prisma.comment.updateMany).toHaveBeenCalledWith({
      data: { isRead: true },
      where: {
        id: "comment-123",
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
          status: { notIn: ["ARCHIVED", "REMOVED"] },
        },
        status: "APPROVED",
      },
    })
  })

  it("marks a single event room feedback comment read if authorized", async () => {
    mocks.prisma.awardEventRoomComment.updateMany.mockResolvedValue({ count: 1 })

    await expect(
      markEventRoomCommentRead("event-comment-123", "writer-1"),
    ).resolves.toEqual({ count: 1 })

    expect(mocks.prisma.awardEventRoomComment.updateMany).toHaveBeenCalledWith({
      data: { isRead: true },
      where: {
        authorId: { not: "writer-1" },
        id: "event-comment-123",
        isRead: false,
        room: { writerId: "writer-1" },
      },
    })
  })

  it("marks a single comment unread if authorized", async () => {
    mocks.prisma.comment.updateMany.mockResolvedValue({ count: 1 })

    await expect(
      markCommentUnread("comment-123", {
        email: "mina@example.com",
        id: "writer-1",
      }),
    ).resolves.toEqual({ count: 1 })

    expect(mocks.prisma.comment.updateMany).toHaveBeenCalledWith({
      data: { isRead: false },
      where: {
        id: "comment-123",
        authorEmail: { not: "mina@example.com" },
        isRead: true,
        post: {
          OR: [
            { authorId: "writer-1" },
            {
              coAuthors: {
                some: { status: "ACCEPTED", userId: "writer-1" },
              },
            },
          ],
          status: { notIn: ["ARCHIVED", "REMOVED"] },
        },
        status: "APPROVED",
      },
    })
  })

  it("marks a single event room feedback comment unread if authorized", async () => {
    mocks.prisma.awardEventRoomComment.updateMany.mockResolvedValue({ count: 1 })

    await expect(
      markEventRoomCommentUnread("event-comment-123", "writer-1"),
    ).resolves.toEqual({ count: 1 })

    expect(mocks.prisma.awardEventRoomComment.updateMany).toHaveBeenCalledWith({
      data: { isRead: false },
      where: {
        authorId: { not: "writer-1" },
        id: "event-comment-123",
        isRead: true,
        room: { writerId: "writer-1" },
      },
    })
  })

  it("marks a single notification read matching notificationId and userId", async () => {
    mocks.prisma.notification.updateMany.mockResolvedValue({ count: 1 })

    await expect(markNotificationRead("notification-123", "writer-1")).resolves.toEqual({
      count: 1,
    })

    expect(mocks.prisma.notification.updateMany).toHaveBeenCalledWith({
      data: { readAt: expect.any(Date) },
      where: {
        id: "notification-123",
        userId: "writer-1",
        readAt: null,
      },
    })
  })

  it("marks a single notification unread matching notificationId and userId", async () => {
    mocks.prisma.notification.updateMany.mockResolvedValue({ count: 1 })

    await expect(markNotificationUnread("notification-123", "writer-1")).resolves.toEqual({
      count: 1,
    })

    expect(mocks.prisma.notification.updateMany).toHaveBeenCalledWith({
      data: { readAt: null },
      where: {
        id: "notification-123",
        userId: "writer-1",
        readAt: { not: null },
      },
    })
  })

  it("creates co-author response notifications for post authors", async () => {
    await createCoAuthorResponseNotification({
      actorName: "Ken",
      actorUsername: "ken",
      postAuthorId: "writer-1",
      postId: "post-1",
      postSlug: "shared-draft",
      postTitle: "Shared Draft",
      type: "COAUTHOR_DECLINED",
    })

    expect(mocks.prisma.notification.create).toHaveBeenCalledWith({
      data: {
        data: {
          actorName: "Ken",
          actorUsername: "ken",
          postId: "post-1",
          postSlug: "shared-draft",
          postTitle: "Shared Draft",
        },
        type: "COAUTHOR_DECLINED",
        userId: "writer-1",
      },
    })
  })
})
