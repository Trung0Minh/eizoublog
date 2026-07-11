import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  revalidateTag: vi.fn(),
  sitePageFindUnique: vi.fn(),
  sitePageUpsert: vi.fn(),
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}))

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sitePage: {
      findUnique: mocks.sitePageFindUnique,
      upsert: mocks.sitePageUpsert,
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

import { GET, POST } from "@/app/api/admin/settings/backgrounds/route"

const root = process.cwd()

describe("background settings admin access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("requires a fresh admin session before reading admin background settings", async () => {
    mocks.getActiveSession.mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(mocks.getActiveSession).toHaveBeenCalledWith(["ADMIN"])
    expect(mocks.sitePageFindUnique).not.toHaveBeenCalled()
  })

  it("invalidates cached backgrounds after an admin update", async () => {
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    mocks.sitePageUpsert.mockResolvedValue({
      content: { spring_light: "/custom/spring.jpg" },
    })

    const response = await POST(
      new Request("https://animeblog.example/api/admin/settings/backgrounds", {
        body: JSON.stringify({
          backgrounds: { spring_light: "/custom/spring.jpg" },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    )

    expect(response.status).toBe(200)
    expect(mocks.revalidateTag).toHaveBeenCalledWith("backgrounds", "max")
  })

  it("keeps the homepage admin flyout behind shared client-session access", () => {
    const homePage = readFileSync(join(root, "app/(public)/page.tsx"), "utf8")

    expect(homePage).not.toContain("getActiveSession")
    expect(homePage).toContain("<ClientAdminBackgroundFlyout />")
  })

  it("keeps the admin background settings route in the admin route group", () => {
    expect(
      existsSync(
        join(root, "app/(admin)/admin/settings/backgrounds/page.tsx"),
      ),
    ).toBe(true)
  })
})
