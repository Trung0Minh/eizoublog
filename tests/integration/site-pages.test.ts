import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock("@/lib/authz", () => ({
  getActiveSession: mocks.getActiveSession,
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: { sitePage: { upsert: mocks.upsert } },
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}))

import { PATCH } from "@/app/api/admin/site-pages/[slug]/route"

describe("site page admin API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
  })

  it("invalidates cached public content after an update", async () => {
    mocks.upsert.mockResolvedValue({
      content: { title: "Updated About" },
      contentText: "Updated About",
      slug: "about",
    })

    const response = await PATCH(
      new Request("https://example.test/api/admin/site-pages/about", {
        body: JSON.stringify({
          content: { title: "Updated About" },
          contentText: "Updated About",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }),
      { params: Promise.resolve({ slug: "about" }) },
    )

    expect(response.status).toBe(200)
    expect(mocks.revalidateTag).toHaveBeenCalledWith("site-pages", "max")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/about")
  })
})
