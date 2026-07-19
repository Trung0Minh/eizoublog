import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    awardEventRoom: {
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
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
  regenerateEventPostIfExists: mocks.regenerateEventPostIfExists,
}))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }))

import { DELETE } from "@/app/api/admin/events/[id]/rooms/[roomId]/route"

const routeContext = {
  params: Promise.resolve({ id: "event-1", roomId: "room-1" }),
}

describe("DELETE /api/admin/events/[id]/rooms/[roomId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    mocks.prisma.$transaction.mockImplementation(async (callback) =>
      callback({ awardEventRoom: mocks.prisma.awardEventRoom }),
    )
    mocks.prisma.awardEventRoom.findMany.mockResolvedValue([
      { id: "room-2", order: 2 },
      { id: "room-3", order: 5 },
    ])
    mocks.prisma.awardEventRoom.delete.mockResolvedValue({ id: "room-1" })
    mocks.prisma.awardEventRoom.update.mockResolvedValue({ id: "room-2" })
  })

  it("requires an admin session", async () => {
    mocks.getActiveSession.mockResolvedValue(null)

    const response = await DELETE(new Request("https://example.test"), routeContext)

    expect(response.status).toBe(401)
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })

  it("returns not found when the room does not belong to the event", async () => {
    mocks.prisma.awardEventRoom.findFirst.mockResolvedValue(null)

    const response = await DELETE(new Request("https://example.test"), routeContext)

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Participant not found" })
    expect(mocks.prisma.awardEventRoom.delete).not.toHaveBeenCalled()
  })

  it("deletes the participant room, normalizes order, and regenerates the article", async () => {
    mocks.prisma.awardEventRoom.findFirst.mockResolvedValue({ id: "room-1" })

    const response = await DELETE(new Request("https://example.test"), routeContext)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Participant removed" },
    })
    expect(mocks.prisma.awardEventRoom.delete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: "room-1" },
    })
    expect(mocks.prisma.awardEventRoom.update).toHaveBeenNthCalledWith(1, {
      data: { order: 0 },
      select: { id: true },
      where: { id: "room-2" },
    })
    expect(mocks.prisma.awardEventRoom.update).toHaveBeenNthCalledWith(2, {
      data: { order: 1 },
      select: { id: true },
      where: { id: "room-3" },
    })
    expect(mocks.regenerateEventPostIfExists).toHaveBeenCalledWith("event-1")
    expect(mocks.revalidateTag).toHaveBeenCalledWith("award-events", "max")
  })
})
