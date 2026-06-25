import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  cacheConfig: null as null | {
    keyParts: string[]
    options: { revalidate?: number; tags?: string[] }
  },
  findUnique: vi.fn(),
  unstableCache: vi.fn(
    <Result>(
      callback: () => Promise<Result>,
      keyParts: string[],
      options: { revalidate?: number; tags?: string[] },
    ) => {
      mocks.cacheConfig = { keyParts, options }
      return callback
    },
  ),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: { sitePage: { findUnique: mocks.findUnique } },
}))
vi.mock("next/cache", () => ({ unstable_cache: mocks.unstableCache }))

import { getCustomBackgrounds } from "@/lib/backgrounds"

describe("getCustomBackgrounds", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("caches background settings behind a dedicated cache tag", async () => {
    mocks.findUnique.mockResolvedValue({
      content: { spring_light: "/custom/spring.jpg" },
    })

    await expect(getCustomBackgrounds()).resolves.toEqual({
      spring_light: "/custom/spring.jpg",
    })
    expect(mocks.findUnique).toHaveBeenCalledWith({
      select: { content: true },
      where: { slug: "site-settings-backgrounds" },
    })
    expect(mocks.cacheConfig).toEqual({
      keyParts: ["custom-backgrounds"],
      options: { revalidate: 300, tags: ["backgrounds"] },
    })
  })

  it("falls back to default backgrounds when the settings query fails", async () => {
    mocks.findUnique.mockRejectedValue(new Error("Database unavailable"))

    await expect(getCustomBackgrounds()).resolves.toBeNull()
  })
})
