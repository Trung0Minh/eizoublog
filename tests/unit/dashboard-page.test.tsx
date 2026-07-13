import { render, screen } from "@testing-library/react"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    $queryRaw: vi.fn(),
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
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({ unstable_cache: mocks.unstableCache }))

import DashboardPage from "@/app/(writer)/dashboard/page"

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "writer-1", role: "WRITER" } })
    mocks.prisma.$queryRaw.mockResolvedValue([])
  })

  it("excludes archived posts from the writer dashboard", async () => {
    render(await DashboardPage())

    expect(screen.getByText("Bảng điều khiển")).toBeVisible()
    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
  })

  it("renders post actions as icon controls with accessible names", async () => {
    mocks.prisma.$queryRaw.mockResolvedValue([
      {
        authorId: "writer-1",
        coAuthors: [],
        commentCount: BigInt(3),
        id: "post-1",
        publishedAt: new Date("2026-06-15T00:00:00Z"),
        slug: "published-post",
        status: "PUBLISHED",
        title: "Published post",
        updatedAt: new Date("2026-06-16T00:00:00Z"),
      },
    ])

    render(await DashboardPage())

    expect(screen.getByRole("link", { name: "Xem bài viết" })).toHaveAttribute(
      "href",
      "/published-post",
    )
    expect(
      screen.getByRole("link", { name: "Chỉnh sửa bài viết" }),
    ).toHaveAttribute("href", "/dashboard/edit/post-1")
    expect(
      screen.getByRole("button", { name: "Rút bài" }),
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Lưu trữ" }),
    ).toBeVisible()
    expect(screen.queryByText("Chỉnh sửa")).not.toBeInTheDocument()
    expect(screen.queryByText("Rút bài")).not.toBeInTheDocument()
    expect(screen.queryByText("Lưu trữ")).not.toBeInTheDocument()
  })
})
