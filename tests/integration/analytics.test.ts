import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  after: vi.fn((task: () => Promise<unknown> | unknown) => {
    void task()
  }),
  recordAnalyticsEvent: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("next/server", () => ({ after: mocks.after }))
vi.mock("@/lib/internalAnalytics", () => ({
  createSessionHash: vi.fn(() => "hashed-session"),
  createVisitorHash: vi.fn(() => "hashed-visitor"),
  recordAnalyticsEvent: mocks.recordAnalyticsEvent,
  shouldIgnoreAnalyticsPath: vi.fn((path: string) => path.startsWith("/admin")),
}))

import { POST } from "@/app/api/analytics/events/route"

function analyticsRequest(body: unknown) {
  return new Request("https://animeblog.example/api/analytics/events", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Vitest Browser",
      "X-Forwarded-For": "203.0.113.10",
    },
    method: "POST",
  })
}

describe("POST /api/analytics/events", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue(null)
    mocks.recordAnalyticsEvent.mockResolvedValue({ tracked: true })
  })

  it("accepts anonymous analytics events and records hashed visitor/session values", async () => {
    const response = await POST(
      analyticsRequest({
        data: { slug: "frieren-memory" },
        eventName: "post_read",
        path: "/frieren-memory",
        sessionId: "session-1",
      }),
    )

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({
      data: { accepted: true },
    })
    expect(mocks.auth).not.toHaveBeenCalled()
    expect(mocks.after).toHaveBeenCalledTimes(1)
    expect(mocks.recordAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "post_read",
        path: "/frieren-memory",
        sessionHash: "hashed-session",
        visitorHash: "hashed-visitor",
      }),
    )
  })

  it("ignores private paths without scheduling analytics work", async () => {
    const response = await POST(
      analyticsRequest({
        eventName: "page_view",
        path: "/admin",
        sessionId: "session-1",
      }),
    )

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({
      data: { tracked: false },
    })
    expect(mocks.auth).not.toHaveBeenCalled()
    expect(mocks.after).not.toHaveBeenCalled()
    expect(mocks.recordAnalyticsEvent).not.toHaveBeenCalled()
  })

  it("rejects invalid analytics payloads", async () => {
    const response = await POST(
      analyticsRequest({
        eventName: "unknown_event",
        path: "/frieren-memory",
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid request" })
  })
})
