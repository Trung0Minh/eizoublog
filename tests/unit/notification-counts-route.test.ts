import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  getNotificationCounts: vi.fn(),
  getUnseenOpenEventCount: vi.fn(),
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}))
vi.mock("@/lib/eventNotifications", () => ({
  getUnseenOpenEventCount: mocks.getUnseenOpenEventCount,
}))
vi.mock("@/lib/notifications", () => ({
  getNotificationCounts: mocks.getNotificationCounts,
}))

import { GET } from "@/app/api/user/notification-counts/route"

describe("GET /api/user/notification-counts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { email: "writer@example.com", id: "writer-1", role: "WRITER" },
    })
    mocks.getNotificationCounts.mockResolvedValue({
      pendingInvites: 1,
      responseEvents: 2,
      total: 4,
      unreadComments: 1,
    })
    mocks.getUnseenOpenEventCount.mockResolvedValue(3)
  })

  it("returns authoritative counts with caching disabled", async () => {
    const response = await GET()

    expect(response.headers.get("Cache-Control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      data: {
        counts: {
          openEvents: 3,
          pendingInvites: 1,
          responseEvents: 2,
          total: 7,
          unreadComments: 1,
        },
      },
    })
  })
})
