import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  sitePageFindUnique: vi.fn(),
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
    },
  },
}))

import { GET } from "@/app/api/admin/settings/backgrounds/route"

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

  it("keeps the homepage admin flyout behind database-backed admin access", () => {
    const homePage = readFileSync(join(root, "app/(public)/page.tsx"), "utf8")

    expect(homePage).toContain('getActiveSession(["ADMIN"])')
    expect(homePage).not.toContain("const session = await auth()")
    expect(homePage).toContain("{activeSession && <AdminBackgroundFlyout />}")
  })

  it("keeps the admin background settings route in the admin route group", () => {
    expect(
      existsSync(
        join(root, "app/(admin)/admin/settings/backgrounds/page.tsx"),
      ),
    ).toBe(true)
  })
})
