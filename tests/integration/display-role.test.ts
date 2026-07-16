import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  revalidateTag: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdateMany: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      updateMany: mocks.userUpdateMany,
    },
  },
}))
vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
  unstable_cache:
    <Args extends unknown[], Result>(fn: (...args: Args) => Result) =>
    (...args: Args) =>
      fn(...args),
}))

import { PATCH } from "@/app/api/profile/display-role/route"

function patchRequest(body: unknown) {
  return new Request("https://example.test/api/profile/display-role", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  })
}

describe("PATCH /api/profile/display-role", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "writer-1", role: "WRITER" } })
    mocks.userFindUnique.mockImplementation(async (query: unknown) => {
      const select =
        typeof query === "object" && query !== null && "select" in query
          ? query.select
          : null

      if (
        typeof select === "object" &&
        select !== null &&
        "displayRoleColor" in select
      ) {
        return {
          displayRoleColor: "#C2410C",
          displayRoleLocked: false,
          displayRoleName: "Seasonal Analyst",
          id: "writer-1",
        }
      }

      if (
        typeof select === "object" &&
        select !== null &&
        "displayRoleLocked" in select
      ) {
        return { displayRoleLocked: false }
      }

      return {
        avatarUrl: null,
        email: "writer@example.com",
        id: "writer-1",
        name: "Mina",
        role: "WRITER",
        username: "mina",
      }
    })
    mocks.userUpdateMany.mockResolvedValue({ count: 1 })
  })

  it("updates the authenticated writer's cosmetic role", async () => {
    const response = await PATCH(
      patchRequest({
        displayRoleColor: "#c2410c",
        displayRoleName: "  Seasonal   Analyst  ",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        displayRoleColor: "#C2410C",
        displayRoleLocked: false,
        displayRoleName: "Seasonal Analyst",
        id: "writer-1",
      },
    })
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      data: {
        displayRoleColor: "#C2410C",
        displayRoleName: "Seasonal Analyst",
      },
      where: {
        displayRoleLocked: false,
        id: "writer-1",
        role: "WRITER",
      },
    })
  })

  it("rejects updates after an admin locks the role", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce({
        avatarUrl: null,
        email: "writer@example.com",
        id: "writer-1",
        name: "Mina",
        role: "WRITER",
        username: "mina",
      })
      .mockResolvedValueOnce({ displayRoleLocked: true })
    mocks.userUpdateMany.mockResolvedValue({ count: 0 })

    const response = await PATCH(
      patchRequest({
        displayRoleColor: "#0D9488",
        displayRoleName: "Film Editor",
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: "Your display role is locked by an admin",
    })
    expect(mocks.userUpdateMany).not.toHaveBeenCalled()
  })

  it("does not overwrite a role locked during the update", async () => {
    mocks.userUpdateMany.mockResolvedValue({ count: 0 })

    const response = await PATCH(
      patchRequest({
        displayRoleColor: "#0D9488",
        displayRoleName: "Film Editor",
      }),
    )

    expect(response.status).toBe(403)
    expect(mocks.userUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ displayRoleLocked: false }),
      }),
    )
  })

  it("rejects non-writer accounts", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mocks.userFindUnique.mockResolvedValueOnce({
      avatarUrl: null,
      email: "admin@example.com",
      id: "admin-1",
      name: "Admin",
      role: "ADMIN",
      username: "admin",
    })

    const response = await PATCH(
      patchRequest({
        displayRoleColor: "#0D9488",
        displayRoleName: "Film Critic",
      }),
    )

    expect(response.status).toBe(401)
    expect(mocks.userUpdateMany).not.toHaveBeenCalled()
  })

  it("rejects reserved names and invalid colors", async () => {
    const response = await PATCH(
      patchRequest({
        displayRoleColor: "red",
        displayRoleName: "Admin",
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid display role",
    })
    expect(mocks.userUpdateMany).not.toHaveBeenCalled()
  })
})
