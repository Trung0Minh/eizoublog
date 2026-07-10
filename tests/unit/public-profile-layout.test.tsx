import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCachedContributors: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} />
  ),
}))
vi.mock("@/components/ui/TextReveal", () => ({
  TextReveal: ({ text }: { text: string }) => <>{text}</>,
}))
vi.mock("@/components/posts/StaticPostContent", () => ({
  StaticPostContent: () => <div />,
}))
vi.mock("@/lib/queries", () => ({
  getCachedContributors: mocks.getCachedContributors,
}))
vi.mock("@/lib/seo", () => ({
  buildMetadata: vi.fn(),
  getAppName: () => "Eizou Blog",
}))

import ContributorsPage from "@/app/(public)/contributors/page"
import { AuthorBio } from "@/components/posts/AuthorBio"

describe("public profile layouts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("isolates a real author avatar from post-content image styles", () => {
    render(
      <AuthorBio
        author={{
          avatarUrl: "/avatar.webp",
          bio: "Writer bio",
          name: "Mina",
          username: "mina",
        }}
      />,
    )

    expect(screen.getByRole("img", { name: "Mina" })).toHaveClass(
      "!m-0",
      "!cursor-default",
      "hover:!opacity-100",
    )
    expect(screen.getByRole("link", { name: "Mina" }).parentElement).toHaveClass(
      "min-w-0",
      "flex-1",
    )
  })

  it("places the contributor role badge beside the name at each breakpoint", async () => {
    mocks.getCachedContributors.mockResolvedValue([
      {
        _count: { posts: 1 },
        avatarUrl: null,
        bio: "Writer bio",
        name: "Mina",
        role: "WRITER",
        username: "mina",
      },
    ])

    render(
      await ContributorsPage({ searchParams: Promise.resolve({}) }),
    )

    const heading = screen.getByRole("heading", { name: "Mina" })
    const badge = screen.getByText("WRITER")
    const row = heading.closest("div")

    expect(row).toContainElement(badge)
    expect(row).toHaveClass(
      "items-center",
      "justify-center",
      "sm:justify-start",
    )

    const metadata = screen.getByText("@mina").closest("div")?.parentElement
    expect(metadata).toHaveClass("w-full")
    expect(metadata?.parentElement).toHaveClass("w-full")
  })
})
