import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  acceptPostReviewRequest: vi.fn(),
  declinePostReviewRequest: vi.fn(),
  getActiveSession: vi.fn(),
  unauthorizedResponse: vi.fn(() =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
  ),
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: mocks.unauthorizedResponse,
}))

vi.mock("@/lib/postReviewRequests", () => ({
  acceptPostReviewRequest: mocks.acceptPostReviewRequest,
  declinePostReviewRequest: mocks.declinePostReviewRequest,
  PostReviewRequestError: class PostReviewRequestError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message)
    }
  },
}))

import { POST as ACCEPT } from "@/app/api/admin/post-review-requests/[id]/accept/route"
import { POST as DECLINE } from "@/app/api/admin/post-review-requests/[id]/decline/route"

function context(id = "review-1") {
  return { params: Promise.resolve({ id }) }
}

function request(body: unknown = {}) {
  return new Request("https://example.test/api/admin/post-review-requests/review-1/decline", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

describe("admin post review request routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "admin-1", name: "Admin", role: "ADMIN" },
    })
  })

  it("accepts a pending review request as admin", async () => {
    const response = await ACCEPT(request(), context())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { status: "ACCEPTED" },
    })
    expect(mocks.acceptPostReviewRequest).toHaveBeenCalledWith("review-1", {
      id: "admin-1",
      name: "Admin",
      role: "ADMIN",
    })
  })

  it("declines a pending review request with a reason", async () => {
    const response = await DECLINE(
      request({ reason: "Please rewrite the last section." }),
      context(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { status: "DECLINED" },
    })
    expect(mocks.declinePostReviewRequest).toHaveBeenCalledWith(
      "review-1",
      { id: "admin-1", name: "Admin", role: "ADMIN" },
      "Please rewrite the last section.",
    )
  })

  it("rejects decline requests without a meaningful reason", async () => {
    const response = await DECLINE(request({ reason: " " }), context())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid request" })
    expect(mocks.declinePostReviewRequest).not.toHaveBeenCalled()
  })

  it("requires admin authentication", async () => {
    mocks.getActiveSession.mockResolvedValue(null)

    const response = await ACCEPT(request(), context())

    expect(response.status).toBe(401)
    expect(mocks.acceptPostReviewRequest).not.toHaveBeenCalled()
  })
})
