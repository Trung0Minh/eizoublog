import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    account: {
      deleteMany: vi.fn(),
    },
    post: {
      count: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    user: {
      delete: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  revalidateTag: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
  unstable_cache:
    <Args extends unknown[], Result>(fn: (...args: Args) => Result) =>
    (...args: Args) =>
      fn(...args),
}))

import { DELETE, PATCH } from "@/app/api/admin/writers/[id]/route"

const activeAdminUser = {
  avatarUrl: null,
  email: "admin@example.com",
  id: "admin-1",
  name: "Admin",
  role: "ADMIN",
  username: "admin",
}

const activeWriterUser = {
  avatarUrl: null,
  email: "writer2@example.com",
  id: "writer-2",
  name: "Writer",
  role: "WRITER",
  username: "writer-2",
}

function mockWriterUserLookup(targetUser: unknown = { id: "writer-1", role: "WRITER" }) {
  mocks.prisma.user.findUnique.mockImplementation(async (query: unknown) => {
    const where =
      typeof query === "object" && query !== null && "where" in query
        ? query.where
        : null
    const id =
      typeof where === "object" &&
      where !== null &&
      "id" in where &&
      typeof where.id === "string"
        ? where.id
        : null

    if (id === "admin-1") {
      return activeAdminUser
    }

    if (id === "writer-2") {
      return activeWriterUser
    }

    if (id === "writer-1" || id === "admin-2") {
      return targetUser
    }

    return null
  })
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

function deleteRequest(id: string) {
  return new Request(`https://example.test/api/admin/writers/${id}`, {
    method: "DELETE",
  })
}

function patchRequest(id: string, body: unknown) {
  return new Request(`https://example.test/api/admin/writers/${id}`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  })
}

describe("PATCH /api/admin/writers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mockWriterUserLookup({ id: "writer-1", role: "WRITER" })
    mocks.prisma.user.update.mockResolvedValue({
      displayRoleColor: "#475569",
      displayRoleLocked: true,
      displayRoleName: "Archive Curator",
      id: "writer-1",
    })
  })

  it("lets admins edit and lock a writer's display role", async () => {
    const response = await PATCH(
      patchRequest("writer-1", {
        displayRoleColor: "#475569",
        displayRoleLocked: true,
        displayRoleName: "Archive Curator",
      }),
      routeContext("writer-1"),
    )

    expect(response.status).toBe(200)
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      data: {
        displayRoleColor: "#475569",
        displayRoleLocked: true,
        displayRoleName: "Archive Curator",
      },
      select: {
        displayRoleColor: true,
        displayRoleLocked: true,
        displayRoleName: true,
        id: true,
      },
      where: { id: "writer-1" },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("users", "max")
  })

  it("lets admins reset a writer to the default badge", async () => {
    await PATCH(
      patchRequest("writer-1", {
        displayRoleColor: null,
        displayRoleLocked: false,
        displayRoleName: null,
      }),
      routeContext("writer-1"),
    )

    expect(mocks.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          displayRoleColor: null,
          displayRoleLocked: false,
          displayRoleName: null,
        },
      }),
    )
  })

  it("does not assign cosmetic writer roles to admin accounts", async () => {
    mockWriterUserLookup({ id: "admin-2", role: "ADMIN" })

    const response = await PATCH(
      patchRequest("admin-2", {
        displayRoleColor: "#475569",
        displayRoleLocked: true,
        displayRoleName: "Archive Curator",
      }),
      routeContext("admin-2"),
    )

    expect(response.status).toBe(400)
    expect(mocks.prisma.user.update).not.toHaveBeenCalled()
  })
})

describe("DELETE /api/admin/writers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mockWriterUserLookup()
    mocks.prisma.post.count.mockResolvedValue(0)
    mocks.prisma.user.delete.mockResolvedValue({ id: "writer-1" })
    mocks.prisma.user.update.mockResolvedValue({ id: "writer-1" })
    mocks.prisma.session.deleteMany.mockResolvedValue({ count: 0 })
    mocks.prisma.account.deleteMany.mockResolvedValue({ count: 0 })
    mocks.prisma.$transaction.mockImplementation(async (input) => {
      if (Array.isArray(input)) {
        return Promise.all(input)
      }

      throw new Error("Unsupported transaction input")
    })
  })

  it("requires an admin session", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "writer-2", role: "WRITER" } })

    const response = await DELETE(deleteRequest("writer-1"), routeContext("writer-1"))

    expect(response.status).toBe(401)
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      select: {
        avatarUrl: true,
        email: true,
        id: true,
        name: true,
        role: true,
        username: true,
      },
      where: { id: "writer-2" },
    })
    expect(mocks.prisma.post.count).not.toHaveBeenCalled()
  })

  it("returns 404 when the writer does not exist", async () => {
    mockWriterUserLookup(null)

    const response = await DELETE(deleteRequest("missing"), routeContext("missing"))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Writer not found" })
  })

  it("does not remove admin accounts", async () => {
    mockWriterUserLookup({
      id: "admin-2",
      role: "ADMIN",
    })

    const response = await DELETE(deleteRequest("admin-2"), routeContext("admin-2"))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Cannot remove admin accounts",
    })
    expect(mocks.prisma.user.delete).not.toHaveBeenCalled()
    expect(mocks.prisma.user.update).not.toHaveBeenCalled()
  })

  it("deletes writers with no authored posts", async () => {
    const response = await DELETE(deleteRequest("writer-1"), routeContext("writer-1"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Writer access removed" },
    })
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      select: { id: true, role: true },
      where: { id: "writer-1" },
    })
    expect(mocks.prisma.post.count).toHaveBeenCalledWith({
      where: { authorId: "writer-1" },
    })
    expect(mocks.prisma.user.delete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: "writer-1" },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("users", "max")
  })

  it("revokes writers with posts while preserving their user record for attribution", async () => {
    mocks.prisma.post.count.mockResolvedValue(3)

    const response = await DELETE(deleteRequest("writer-1"), routeContext("writer-1"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { message: "Writer access removed" },
    })
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      data: { role: "REVOKED" },
      select: { id: true },
      where: { id: "writer-1" },
    })
    expect(mocks.prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "writer-1" },
    })
    expect(mocks.prisma.account.deleteMany).toHaveBeenCalledWith({
      where: { userId: "writer-1" },
    })
    expect(mocks.prisma.user.delete).not.toHaveBeenCalled()
    expect(mocks.revalidateTag).toHaveBeenCalledWith("users", "max")
  })
})
