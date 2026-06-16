import { render, screen } from "@testing-library/react"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    post: {
      findMany: vi.fn(),
    },
  },
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
  unstableCache: vi.fn((callback: unknown) => callback),
}))

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({ unstable_cache: mocks.unstableCache }))

import DashboardPage from "@/app/(writer)/dashboard/page"

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "writer-1", role: "WRITER" } })
    mocks.prisma.post.findMany.mockResolvedValue([])
  })

  it("excludes archived posts from the writer dashboard", async () => {
    render(await DashboardPage())

    expect(screen.getByText("Bài viết của tôi")).toBeVisible()
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { authorId: "writer-1" },
            {
              coAuthors: {
                some: {
                  status: { in: ["ACCEPTED", "PENDING"] },
                  userId: "writer-1",
                },
              },
            },
          ],
          status: { not: "ARCHIVED" },
        },
      }),
    )
  })
})
