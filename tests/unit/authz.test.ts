import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cacheEntries: [] as Array<{
    keyParts: string[]
    options: { revalidate?: number; tags?: string[] }
  }>,
  userFindUnique: vi.fn(),
  unstableCache: vi.fn(
    <Args extends unknown[], Result>(
      callback: (...args: Args) => Promise<Result>,
      keyParts: string[],
      options: { revalidate?: number; tags?: string[] },
    ) => {
      mocks.cacheEntries.push({ keyParts, options })
      return callback
    },
  ),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("next/cache", () => ({ unstable_cache: mocks.unstableCache }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}))

import { getActiveSession } from "@/lib/authz"

describe("getActiveSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not query the database when there is no session", async () => {
    mocks.auth.mockResolvedValue(null)

    await expect(getActiveSession()).resolves.toBeNull()

    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })

  it("returns a database-backed active user for allowed roles", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "writer-1",
        role: "WRITER",
      },
    })
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Mina Writer",
      role: "WRITER",
      username: "mina",
    })

    await expect(getActiveSession(["ADMIN", "WRITER"])).resolves.toEqual({
      session: {
        user: {
          id: "writer-1",
          role: "WRITER",
        },
      },
      user: {
        avatarUrl: null,
        email: "writer@example.com",
        id: "writer-1",
        name: "Mina Writer",
        role: "WRITER",
        username: "mina",
      },
    })
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      select: {
        avatarUrl: true,
        email: true,
        id: true,
        name: true,
        role: true,
        username: true,
      },
      where: { id: "writer-1" },
    })
    expect(mocks.cacheEntries).toContainEqual({
      keyParts: ["active-session-user"],
      options: { revalidate: 60, tags: ["users"] },
    })
  })

  it("rejects revoked users and stale admin JWTs", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "writer-1",
        role: "ADMIN",
      },
    })
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Mina Writer",
      role: "WRITER",
      username: "mina",
    })

    await expect(getActiveSession(["ADMIN"])).resolves.toBeNull()

    mocks.userFindUnique.mockResolvedValueOnce({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Mina Writer",
      role: "REVOKED",
      username: "mina",
    })

    await expect(getActiveSession(["ADMIN", "WRITER"])).resolves.toBeNull()
  })
})
