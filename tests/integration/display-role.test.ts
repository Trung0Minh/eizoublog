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

function mockAdminUserLookup({
  displayRoleColor = "#475569",
  displayRoleName = "Editor-in-Chief",
}: {
  displayRoleColor?: string | null
  displayRoleName?: string | null
} = {}) {
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
        displayRoleColor,
        displayRoleLocked: false,
        displayRoleName,
        id: "admin-1",
      }
    }

    if (
      typeof select === "object" &&
      select !== null &&
      "displayRoleLocked" in select
    ) {
      return { displayRoleLocked: false, role: "ADMIN" }
    }

    return {
      avatarUrl: null,
      email: "admin@example.com",
      id: "admin-1",
      name: "Admin",
      role: "ADMIN",
      username: "admin",
    }
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
        return { displayRoleLocked: false, role: "WRITER" }
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
      .mockResolvedValueOnce({ displayRoleLocked: true, role: "WRITER" })
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

  it("lets admins update a cosmetic title without changing their authority role", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mockAdminUserLookup()

    const response = await PATCH(
      patchRequest({
        displayRoleColor: "#475569",
        displayRoleName: "Editor-in-Chief",
      }),
    )

    expect(response.status).toBe(200)
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      data: {
        displayRoleColor: "#475569",
        displayRoleName: "Editor-in-Chief",
      },
      where: { id: "admin-1", role: "ADMIN" },
    })
  })

  it("lets admins remove their optional custom title", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mockAdminUserLookup({ displayRoleColor: null, displayRoleName: null })

    const response = await PATCH(
      patchRequest({ displayRoleColor: null, displayRoleName: null }),
    )

    expect(response.status).toBe(200)
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      data: { displayRoleColor: null, displayRoleName: null },
      where: { id: "admin-1", role: "ADMIN" },
    })
  })

  it("does not let writers remove the required Writer badge", async () => {
    const response = await PATCH(
      patchRequest({ displayRoleColor: null, displayRoleName: null }),
    )

    expect(response.status).toBe(400)
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
