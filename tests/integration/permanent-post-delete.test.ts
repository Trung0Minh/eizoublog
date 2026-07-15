import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn(),
    analyticsDailyPage: { deleteMany: vi.fn() },
    analyticsEvent: { deleteMany: vi.fn() },
    awardEvent: { updateMany: vi.fn() },
    awardEventRoom: { updateMany: vi.fn() },
    notification: { deleteMany: vi.fn() },
    post: {
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  }

  return {
    auth: vi.fn(),
    deleteR2Objects: vi.fn(),
    getActiveSession: vi.fn(),
    prisma,
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
  }
})

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@/lib/r2", () => ({ deleteR2Objects: mocks.deleteR2Objects }))
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}))

import { DELETE } from "@/app/api/posts/[id]/route"

function deleteRequest(confirmation: string) {
  return new Request("https://example.test/api/posts/post-1", {
    body: JSON.stringify({ confirmation }),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  })
}

const routeContext = { params: Promise.resolve({ id: "post-1" }) }

describe("permanent post deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "admin-1", name: "Admin", role: "ADMIN" },
    })
    mocks.prisma.post.findMany.mockResolvedValue([])
    mocks.prisma.$transaction.mockImplementation(async (callback) =>
      callback(mocks.prisma),
    )
  })

  it("only permanently deletes removed posts after exact-title confirmation", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      content: {
        content: [
          {
            attrs: {
              src: "https://cdn.example.com/content-images/frame.webp",
            },
            type: "image",
          },
        ],
        type: "doc",
      },
      coverUrl: "https://cdn.example.com/covers/frieren.webp?crop=wide",
      id: "post-1",
      slug: "frieren-animation",
      status: "REMOVED",
      title: "Frieren Animation",
    })
    mocks.prisma.post.delete.mockResolvedValue({ id: "post-1" })

    const response = await DELETE(
      deleteRequest("Frieren Animation"),
      routeContext,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Post permanently deleted" },
    })
    expect(mocks.deleteR2Objects).toHaveBeenCalledWith([
      "https://cdn.example.com/covers/frieren.webp?crop=wide",
      "https://cdn.example.com/content-images/frame.webp",
    ])
    expect(mocks.prisma.awardEvent.updateMany).toHaveBeenCalledWith({
      data: { finalPostId: null },
      where: { finalPostId: "post-1" },
    })
    expect(mocks.prisma.awardEventRoom.updateMany).toHaveBeenCalledWith({
      data: { postId: null },
      where: { postId: "post-1" },
    })
    expect(mocks.prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { data: { equals: "post-1", path: ["postId"] } },
    })
    expect(mocks.prisma.analyticsEvent.deleteMany).toHaveBeenCalledWith({
      where: { postSlug: "frieren-animation" },
    })
    expect(mocks.prisma.analyticsDailyPage.deleteMany).toHaveBeenCalledWith({
      where: { postSlug: "frieren-animation" },
    })
    expect(mocks.prisma.post.delete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: "post-1" },
    })
  })

  it("rejects deletion until the post is removed and the title matches", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      content: { content: [], type: "doc" },
      coverUrl: null,
      id: "post-1",
      slug: "frieren-animation",
      status: "ARCHIVED",
      title: "Frieren Animation",
    })

    const activeResponse = await DELETE(
      deleteRequest("Frieren Animation"),
      routeContext,
    )

    expect(activeResponse.status).toBe(409)
    expect(mocks.prisma.post.delete).not.toHaveBeenCalled()

    mocks.prisma.post.findUnique.mockResolvedValue({
      content: { content: [], type: "doc" },
      coverUrl: null,
      id: "post-1",
      slug: "frieren-animation",
      status: "REMOVED",
      title: "Frieren Animation",
    })

    const mismatchResponse = await DELETE(
      deleteRequest("Wrong title"),
      routeContext,
    )

    expect(mismatchResponse.status).toBe(400)
    expect(mocks.prisma.post.delete).not.toHaveBeenCalled()
  })

  it("keeps media still referenced by another post", async () => {
    const sharedUrl = "https://cdn.example.com/content-images/shared.webp"
    mocks.prisma.post.findUnique.mockResolvedValue({
      content: { content: [{ attrs: { src: sharedUrl }, type: "image" }] },
      coverUrl: "https://cdn.example.com/covers/unique.webp",
      id: "post-1",
      slug: "frieren-animation",
      status: "REMOVED",
      title: "Frieren Animation",
    })
    mocks.prisma.post.findMany.mockResolvedValue([
      { content: { content: [] }, coverUrl: sharedUrl },
    ])

    await DELETE(deleteRequest("Frieren Animation"), routeContext)

    expect(mocks.deleteR2Objects).toHaveBeenCalledWith([
      "https://cdn.example.com/covers/unique.webp",
    ])
  })
})
