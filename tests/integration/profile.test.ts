import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  revalidateTag: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
  },
}))

import { PATCH } from "@/app/api/profile/route"

const writerSession = {
  user: {
    id: "writer-1",
    email: "writer@example.com",
    name: "Mina",
    role: "WRITER",
    username: "mina",
    avatarUrl: null,
  },
}

function patchRequest(body: unknown) {
  return new Request("https://example.test/api/profile", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  })
}

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue(writerSession)
    mocks.userFindUnique.mockResolvedValue({
      avatarUrl: null,
      email: "writer@example.com",
      id: "writer-1",
      name: "Mina",
      role: "WRITER",
      username: "mina",
    })
    mocks.userUpdate.mockResolvedValue({
      avatarUrl: "https://cdn.example.com/avatars/mina.png",
      bio: "Animation writer.",
      email: "writer@example.com",
      id: "writer-1",
      name: "Mina Revised",
      username: "mina",
    })
  })

  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue(null)

    const response = await PATCH(
      patchRequest({ bio: "Nope", name: "Mina Revised" }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
  })

  it("updates only the authenticated user's editable profile fields", async () => {
    mocks.userUpdate.mockResolvedValue({
      avatarUrl: "https://cdn.example.com/avatars/mina.png",
      bio: "Animation writer.",
      email: "writer@example.com",
      id: "writer-1",
      name: "Mina Revised",
      username: "changed",
    })

    const response = await PATCH(
      patchRequest({
        avatarUrl: "https://cdn.example.com/avatars/mina.png",
        bio: " Animation writer. ",
        email: "changed@example.com",
        id: "other-user",
        name: " Mina Revised ",
        username: "changed",
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        avatarUrl: "https://cdn.example.com/avatars/mina.png",
        bio: "Animation writer.",
        email: "writer@example.com",
        id: "writer-1",
        name: "Mina Revised",
        username: "changed",
      },
    })
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      data: {
        avatarUrl: "https://cdn.example.com/avatars/mina.png",
        bio: "Animation writer.",
        name: "Mina Revised",
        username: "changed",
      },
      select: {
        avatarUrl: true,
        bio: true,
        email: true,
        id: true,
        name: true,
        username: true,
      },
      where: { id: "writer-1" },
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("users", "max")
  })

  it("stores blank optional fields as null", async () => {
    await PATCH(
      patchRequest({
        avatarUrl: null,
        bio: "",
        name: "Mina",
      }),
    )

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          avatarUrl: null,
          bio: null,
          name: "Mina",
        },
      }),
    )
  })

  it("returns 400 for invalid profile data", async () => {
    const response = await PATCH(patchRequest({ bio: "Bio", name: "M" }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid request" })
    expect(mocks.userUpdate).not.toHaveBeenCalled()
  })
})
