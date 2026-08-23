import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    category: { findFirst: vi.fn() },
    post: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    postAuditEvent: { create: vi.fn() },
    postRevision: { create: vi.fn() },
    postTag: { createMany: vi.fn(), deleteMany: vi.fn() },
    tag: { findFirst: vi.fn() },
  },
  revalidate: vi.fn(),
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@/lib/postRevalidation", () => ({ revalidatePostMutationPaths: mocks.revalidate }))

import { GET, POST } from "@/app/api/posts/import/route"

const content = { content: [{ type: "paragraph" }], type: "doc" }
const backup = {
  data: {
    formatVersion: 1,
    post: {
      category: { id: "old-category", slug: "reviews" },
      content,
      contentText: "Imported body",
      tags: [{ tag: { id: "old-tag", slug: "sakuga" } }],
      title: "Imported title",
    },
  },
}

function request(body: unknown) {
  return new Request("https://example.test/api/posts/import", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

function existingPost(overrides: Record<string, unknown> = {}) {
  return {
    authorId: "writer-1",
    categoryId: "category-1",
    coAuthors: [{ userId: "writer-2" }],
    content: { type: "doc" },
    contentText: "Original",
    coverAlt: null,
    coverUrl: null,
    draftVisibility: "CO_AUTHORS",
    excerpt: null,
    excerptContent: null,
    id: "post-1",
    publishedAt: new Date("2026-08-01T00:00:00Z"),
    removedAt: null,
    removedFromStatus: null,
    slug: "original-post",
    status: "PUBLISHED",
    tags: [{ tagId: "tag-1" }],
    title: "Original title",
    version: 4,
    ...overrides,
  }
}

describe("post backup import", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({ user: { id: "writer-1", role: "WRITER" } })
    mocks.prisma.$transaction.mockImplementation(async (callback) => callback(mocks.prisma))
    mocks.prisma.category.findFirst.mockResolvedValue({ id: "category-1" })
    mocks.prisma.tag.findFirst.mockResolvedValue({ id: "tag-1" })
    mocks.prisma.postAuditEvent.create.mockResolvedValue({ id: "audit-1" })
    mocks.prisma.postRevision.create.mockResolvedValue({ id: "revision-1" })
  })

  it("requires an active writer or admin", async () => {
    mocks.getActiveSession.mockResolvedValue(null)
    const response = await POST(request({ backup, mode: "CREATE_DRAFT" }))
    expect(response.status).toBe(401)
  })

  it("creates a private draft with a baseline revision", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(null)
    mocks.prisma.post.create.mockResolvedValue({ id: "new-post", slug: "imported-title", status: "DRAFT", version: 1 })

    const response = await POST(request({ backup, mode: "CREATE_DRAFT" }))

    expect(response.status).toBe(200)
    expect(mocks.prisma.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ authorId: "writer-1", draftVisibility: "PRIVATE", status: "DRAFT" }),
    }))
    expect(mocks.prisma.postRevision.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ kind: "BASELINE" }),
    }))
    expect(JSON.stringify(await response.json())).not.toContain("authorEmail")
  })

  it("saves an import guard and returns a published target to draft", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(existingPost())
    mocks.prisma.post.update.mockResolvedValue({ id: "post-1", slug: "original-post", status: "DRAFT", version: 5 })

    const response = await POST(request({ backup, baseVersion: 4, mode: "OVERWRITE", targetPostId: "post-1" }))

    expect(response.status).toBe(200)
    expect(mocks.prisma.postRevision.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ kind: "IMPORT_GUARD", sourceVersion: 4 }),
    }))
    expect(mocks.prisma.post.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ featuredAt: null, publishedAt: null, status: "DRAFT" }),
      where: { id: "post-1", version: 4 },
    }))
  })

  it("forbids a co-author from overwriting the owner's post", async () => {
    mocks.getActiveSession.mockResolvedValue({ user: { id: "writer-2", role: "WRITER" } })
    mocks.prisma.post.findUnique.mockResolvedValue(existingPost())
    const response = await POST(request({ backup, baseVersion: 4, mode: "OVERWRITE", targetPostId: "post-1" }))
    expect(response.status).toBe(403)
    expect(mocks.prisma.post.update).not.toHaveBeenCalled()
  })

  it("rejects a stale overwrite version", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue(existingPost({ version: 5 }))
    const response = await POST(request({ backup, baseVersion: 4, mode: "OVERWRITE", targetPostId: "post-1" }))
    expect(response.status).toBe(409)
    expect(mocks.prisma.postRevision.create).not.toHaveBeenCalled()
  })

  it("lists only owned active targets for writers", async () => {
    mocks.prisma.post.findMany.mockResolvedValue([{ id: "post-1", status: "DRAFT", title: "Draft", version: 2 }])
    const response = await GET()
    expect(response.status).toBe(200)
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ authorId: "writer-1", status: { in: ["DRAFT", "PUBLISHED"] } }),
    }))
  })
})
