import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    post: { findUnique: vi.fn(), update: vi.fn() },
    postAuditEvent: { create: vi.fn() },
    postRevision: { create: vi.fn(), count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    postTag: { createMany: vi.fn(), deleteMany: vi.fn() },
  },
  revalidate: vi.fn(),
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@/lib/postRevalidation", () => ({ revalidatePostMutationPaths: mocks.revalidate }))

import { GET } from "@/app/api/posts/[id]/revisions/route"
import { POST } from "@/app/api/posts/[id]/revisions/[revisionId]/restore/route"

const context = { params: Promise.resolve({ id: "post-1" }) }
const restoreContext = {
  params: Promise.resolve({ id: "post-1", revisionId: "revision-1" }),
}

describe("post revision recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.$transaction.mockImplementation(async (input) => {
      if (Array.isArray(input)) return Promise.all(input)
      return input(mocks.prisma)
    })
  })

  it("lets an accepted co-author inspect revision history", async () => {
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [{ status: "ACCEPTED", userId: "writer-2" }],
      id: "post-1",
    })
    mocks.prisma.postRevision.findMany.mockResolvedValue([{ id: "revision-1" }])
    mocks.prisma.postRevision.count.mockResolvedValue(1)

    const response = await GET(
      new Request("https://example.test/api/posts/post-1/revisions"),
      context,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: { revisions: [{ id: "revision-1" }], total: 1 },
    })
  })

  it("forbids co-authors from restoring a revision", async () => {
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "writer-2", role: "WRITER" },
    })
    mocks.prisma.post.findUnique.mockResolvedValue({
      authorId: "writer-1",
      coAuthors: [{ status: "ACCEPTED", userId: "writer-2" }],
      id: "post-1",
      version: 4,
    })

    const response = await POST(
      new Request("https://example.test/api/posts/post-1/revisions/revision-1/restore", {
        body: JSON.stringify({ baseVersion: 4 }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
      restoreContext,
    )

    expect(response.status).toBe(403)
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })
})
