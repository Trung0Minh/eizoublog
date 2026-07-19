import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    awardEvent: { update: vi.fn() },
    awardEventRoom: { updateMany: vi.fn() },
  },
  regenerateEventPostIfExists: vi.fn(),
  revalidateTag: vi.fn(),
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
  awardEventDetailSelect: { id: true },
  regenerateEventPostIfExists: mocks.regenerateEventPostIfExists,
}))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: mocks.revalidateTag,
}))

import { PATCH } from "@/app/api/admin/events/[id]/route"

describe("PATCH /api/admin/events/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    mocks.prisma.awardEventRoom.updateMany.mockResolvedValue({ count: 1 })
    mocks.prisma.awardEvent.update.mockResolvedValue({ id: "event-1" })
    mocks.prisma.$transaction.mockImplementation(async (operations) => {
      if (!Array.isArray(operations)) {
        throw new Error("Interactive transactions exceed the remote database timeout")
      }
      return Promise.all(operations)
    })
  })

  it("persists a rapid-shuffle order through a batch transaction", async () => {
    const request = new Request("https://example.test/api/admin/events/event-1", {
      body: JSON.stringify({
        roomOrder: [
          { id: "room-2", order: 0 },
          { id: "room-1", order: 1 },
          { id: "room-3", order: 2 },
        ],
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "event-1" }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ data: { id: "event-1" } })
    expect(mocks.prisma.$transaction).toHaveBeenCalledWith(expect.any(Array))
    expect(mocks.prisma.awardEventRoom.updateMany).toHaveBeenCalledTimes(3)
    expect(mocks.regenerateEventPostIfExists).toHaveBeenCalledWith("event-1")
  })
})
