import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  regenerateEventPostIfExists: vi.fn(),
  updateAwardEventRoom: vi.fn(),
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}))
vi.mock("@/lib/awardEventService", () => ({
  AwardEventError: class AwardEventError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message)
    }
  },
  regenerateEventPostIfExists: mocks.regenerateEventPostIfExists,
  updateAwardEventRoom: mocks.updateAwardEventRoom,
}))
vi.mock("@/lib/prisma", () => ({ prisma: {} }))

import { PATCH } from "@/app/api/events/[id]/room/route"

describe("PATCH /api/events/[id]/room", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.updateAwardEventRoom.mockResolvedValue({
      id: "room-1",
      status: "SUBMITTED",
    })
  })

  it("regenerates the public event post after a submitted room update", async () => {
    const request = new Request("https://example.test/api/events/event-1/room", {
      body: JSON.stringify({
        postId: "post-1",
        status: "SUBMITTED",
        visibility: "PRIVATE",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "event-1" }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { id: "room-1", status: "SUBMITTED" },
    })
    expect(mocks.updateAwardEventRoom).toHaveBeenCalledWith({
      eventId: "event-1",
      postId: "post-1",
      status: "SUBMITTED",
      visibility: "PRIVATE",
      writerId: "writer-1",
    })
    expect(mocks.regenerateEventPostIfExists).toHaveBeenCalledWith("event-1")
  })

  it("does not regenerate the public event post for draft-only updates", async () => {
    const request = new Request("https://example.test/api/events/event-1/room", {
      body: JSON.stringify({
        postId: "post-1",
        status: "DRAFT",
        visibility: "PRIVATE",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "event-1" }),
    })

    expect(response.status).toBe(200)
    expect(mocks.regenerateEventPostIfExists).not.toHaveBeenCalled()
  })
})
