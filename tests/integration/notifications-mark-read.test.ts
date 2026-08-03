import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  markCommentRead: vi.fn(),
  markCommentUnread: vi.fn(),
  markEventRoomCommentRead: vi.fn(),
  markEventRoomCommentUnread: vi.fn(),
  markNotificationRead: vi.fn(),
  markNotificationUnread: vi.fn(),
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}))

vi.mock("@/lib/notifications", () => ({
  markCommentRead: mocks.markCommentRead,
  markCommentUnread: mocks.markCommentUnread,
  markEventRoomCommentRead: mocks.markEventRoomCommentRead,
  markEventRoomCommentUnread: mocks.markEventRoomCommentUnread,
  markNotificationRead: mocks.markNotificationRead,
  markNotificationUnread: mocks.markNotificationUnread,
}))

import { POST } from "@/app/api/user/notifications/mark-read/route"

function postRequest(body: unknown) {
  return new Request("https://example.test/api/user/notifications/mark-read", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

const writerSession = {
  user: {
    email: "writer@example.com",
    id: "writer-1",
    role: "WRITER",
  },
}

describe("POST /api/user/notifications/mark-read", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue(writerSession)
    mocks.markCommentRead.mockResolvedValue({ count: 1 })
    mocks.markCommentUnread.mockResolvedValue({ count: 1 })
    mocks.markEventRoomCommentRead.mockResolvedValue({ count: 1 })
    mocks.markEventRoomCommentUnread.mockResolvedValue({ count: 1 })
    mocks.markNotificationRead.mockResolvedValue({ count: 1 })
    mocks.markNotificationUnread.mockResolvedValue({ count: 1 })
  })

  it("rejects unauthorized requests", async () => {
    mocks.getActiveSession.mockResolvedValue(null)

    const response = await POST(postRequest({ commentId: "comment-1" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(mocks.markCommentRead).not.toHaveBeenCalled()
  })

  it("marks a comment as read if commentId is provided", async () => {
    const response = await POST(postRequest({ commentId: "comment-123" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { success: true },
    })
    expect(mocks.markCommentRead).toHaveBeenCalledWith("comment-123", writerSession.user)
    expect(mocks.markNotificationRead).not.toHaveBeenCalled()
  })

  it("marks a notification as read if notificationId is provided", async () => {
    const response = await POST(postRequest({ notificationId: "notification-123" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { success: true },
    })
    expect(mocks.markNotificationRead).toHaveBeenCalledWith("notification-123", "writer-1")
    expect(mocks.markCommentRead).not.toHaveBeenCalled()
  })

  it("marks a notification as unread when read is false", async () => {
    const response = await POST(
      postRequest({ notificationId: "notification-123", read: false }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { success: true },
    })
    expect(mocks.markNotificationUnread).toHaveBeenCalledWith(
      "notification-123",
      "writer-1",
    )
    expect(mocks.markNotificationRead).not.toHaveBeenCalled()
  })

  it("marks a comment as unread when read is false", async () => {
    const response = await POST(
      postRequest({ commentId: "comment-123", read: false }),
    )

    expect(response.status).toBe(200)
    expect(mocks.markCommentUnread).toHaveBeenCalledWith(
      "comment-123",
      writerSession.user,
    )
    expect(mocks.markCommentRead).not.toHaveBeenCalled()
  })

  it("marks event room feedback as unread when read is false", async () => {
    const response = await POST(
      postRequest({ eventRoomCommentId: "event-comment-123", read: false }),
    )

    expect(response.status).toBe(200)
    expect(mocks.markEventRoomCommentUnread).toHaveBeenCalledWith(
      "event-comment-123",
      "writer-1",
    )
    expect(mocks.markEventRoomCommentRead).not.toHaveBeenCalled()
  })

  it("marks event room feedback as read if eventRoomCommentId is provided", async () => {
    const response = await POST(
      postRequest({ eventRoomCommentId: "event-comment-123" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { success: true },
    })
    expect(mocks.markEventRoomCommentRead).toHaveBeenCalledWith(
      "event-comment-123",
      "writer-1",
    )
    expect(mocks.markCommentRead).not.toHaveBeenCalled()
    expect(mocks.markNotificationRead).not.toHaveBeenCalled()
  })

  it("marks both as read if both commentId and notificationId are provided", async () => {
    const response = await POST(
      postRequest({ commentId: "comment-123", notificationId: "notification-123" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { success: true },
    })
    expect(mocks.markCommentRead).toHaveBeenCalledWith("comment-123", writerSession.user)
    expect(mocks.markNotificationRead).toHaveBeenCalledWith("notification-123", "writer-1")
  })

  it("fails if both commentId and notificationId are missing", async () => {
    const response = await POST(postRequest({}))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Missing commentId, eventRoomCommentId, or notificationId",
    })
  })

  it("fails if commentId is not a string", async () => {
    const response = await POST(postRequest({ commentId: 123 }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid commentId format",
    })
  })

  it("fails if notificationId is not a string", async () => {
    const response = await POST(postRequest({ notificationId: true }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid notificationId format",
    })
  })

  it("fails if eventRoomCommentId is not a string", async () => {
    const response = await POST(postRequest({ eventRoomCommentId: true }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid eventRoomCommentId format",
    })
  })

  it("fails if read is not a boolean", async () => {
    const response = await POST(postRequest({ notificationId: "notification-1", read: "yes" }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid read format",
    })
  })

  it("fails with 400 when invalid JSON is provided", async () => {
    const request = new Request("https://example.test/api/user/notifications/mark-read", {
      body: "{invalid-json",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON body",
    })
  })

  it("fails with 500 when database helper throws an error", async () => {
    console.error = vi.fn() // mock console.error to avoid cluttering test logs
    mocks.markCommentRead.mockRejectedValue(new Error("Database error"))

    const response = await POST(postRequest({ commentId: "comment-123" }))
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: "Internal error",
    })
  })
})
