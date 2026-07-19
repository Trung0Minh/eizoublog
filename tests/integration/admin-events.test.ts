import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    awardEvent: {
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    awardEventRoom: { updateMany: vi.fn() },
    analyticsDailyPage: { deleteMany: vi.fn() },
    analyticsEvent: { deleteMany: vi.fn() },
    notification: { deleteMany: vi.fn() },
    mediaCleanupJob: { create: vi.fn() },
    post: { delete: vi.fn(), findMany: vi.fn() },
    postRevision: { deleteMany: vi.fn() },
    postAuditEvent: { create: vi.fn() },
  },
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}))

import { DELETE } from "@/app/api/admin/events/[id]/route"

function deleteRequest(confirmation: string) {
  return new Request("https://animeblog.example/api/admin/events/event-1", {
    body: JSON.stringify({ confirmation }),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  })
}

const routeContext = { params: Promise.resolve({ id: "event-1" }) }

describe("DELETE /api/admin/events/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    mocks.prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        awardEvent: mocks.prisma.awardEvent,
        awardEventRoom: mocks.prisma.awardEventRoom,
        analyticsDailyPage: mocks.prisma.analyticsDailyPage,
        analyticsEvent: mocks.prisma.analyticsEvent,
        notification: mocks.prisma.notification,
        mediaCleanupJob: mocks.prisma.mediaCleanupJob,
        post: mocks.prisma.post,
        postRevision: mocks.prisma.postRevision,
        postAuditEvent: mocks.prisma.postAuditEvent,
      }),
    )
    mocks.prisma.awardEvent.delete.mockResolvedValue({ id: "event-1" })
    mocks.prisma.post.delete.mockResolvedValue({ id: "final-post-1" })
    mocks.prisma.post.findMany.mockResolvedValue([])
    mocks.prisma.postAuditEvent.create.mockResolvedValue({ id: "audit-1" })
  })

  it("requires an admin session", async () => {
    mocks.getActiveSession.mockResolvedValue(null)

    const response = await DELETE(deleteRequest("Awards"), routeContext)

    expect(response.status).toBe(401)
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })

  it("requires the exact event title as confirmation", async () => {
    mocks.prisma.awardEvent.findUnique.mockResolvedValue({
      finalPost: null,
      id: "event-1",
      title: "Awards",
    })

    const response = await DELETE(deleteRequest("Wrong title"), routeContext)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Event title does not match",
    })
    expect(mocks.prisma.awardEvent.delete).not.toHaveBeenCalled()
  })

  it("deletes the event and permanently deletes its generated post", async () => {
    mocks.prisma.awardEvent.findUnique.mockResolvedValue({
      finalPost: {
        content: { content: [], type: "doc" },
        coverUrl: null,
        id: "final-post-1",
        slug: "awards",
        title: "Awards",
      },
      id: "event-1",
      title: "Awards",
    })

    const response = await DELETE(deleteRequest("Awards"), routeContext)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Event deleted" },
    })
    expect(mocks.prisma.post.delete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: "final-post-1" },
    })
    expect(mocks.prisma.postAuditEvent.create).toHaveBeenCalledWith({
      data: {
        action: "PURGE",
        actorId: "admin-1",
        metadata: {
          eventId: "event-1",
          reason: "Award event permanently removed",
          title: "Awards",
        },
        postId: "final-post-1",
        sourceVersion: null,
      },
      select: { id: true },
    })
    expect(mocks.prisma.awardEvent.delete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: "event-1" },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("award-events", "max")
    expect(mocks.revalidateTag).toHaveBeenCalledWith("posts", "max")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/awards")
  })
})
