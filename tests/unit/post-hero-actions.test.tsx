import { render, screen } from "@testing-library/react"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const sessionMocks = vi.hoisted(() => ({
  user: null as { role: "ADMIN" | "WRITER"; username: string } | null,
}))

vi.mock("next/link", () => ({
  default: (
    props: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean },
  ) => {
    const { prefetch, ...anchorProps } = props
    void prefetch
    return <a {...anchorProps} />
  },
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock("@/lib/clientSession", () => ({
  useSessionUser: () => ({ status: "authenticated", user: sessionMocks.user }),
}))

import { PostHero } from "@/components/posts/PostHero"

const post = {
  _count: { comments: 0 },
  author: {
    avatarUrl: null,
    bio: null,
    name: "Writer",
    username: "writer",
  },
  category: null,
  coAuthors: [],
  coverAlt: "Cover",
  coverUrl: "/cover.webp",
  excerpt: null,
  excerptContent: null,
  featuredAt: null,
  id: "post-1",
  publishedAt: new Date("2026-08-01T00:00:00Z"),
  slug: "post-title",
  status: "PUBLISHED" as const,
  tags: [],
  title: "Post title",
}

describe("PostHero mobile action layout", () => {
  beforeEach(() => {
    sessionMocks.user = null
  })

  it("keeps a writer edit action beside the flexible author card on mobile", () => {
    sessionMocks.user = { role: "WRITER", username: "writer" }

    render(<PostHero authorUsernames={["writer"]} post={post} />)

    expect(screen.getByTestId("post-author-card")).toHaveClass(
      "min-w-0",
      "w-fit",
    )
    expect(screen.getByTestId("post-author-card")).not.toHaveClass("flex-1")
    expect(screen.getByTestId("post-inline-actions")).toHaveClass(
      "contents",
      "sm:flex",
    )
    expect(screen.getByRole("link", { name: "Chỉnh sửa bài viết" })).toBeVisible()
  })

  it("keeps admin edit beside the author while wrapping only admin tools on mobile", () => {
    sessionMocks.user = { role: "ADMIN", username: "writer" }

    render(<PostHero authorUsernames={["writer"]} post={post} />)

    expect(screen.getByRole("link", { name: "Chỉnh sửa bài viết" })).toBeVisible()
    expect(screen.getByTestId("post-inline-actions")).not.toHaveClass("basis-full")
    expect(screen.getByTestId("post-admin-actions")).toHaveClass(
      "basis-full",
      "sm:basis-auto",
    )
  })

  it("tightens the title spacing when the post has no subtitle", () => {
    render(
      <PostHero
        post={{
          ...post,
          excerptContent: {
            content: [{ content: [], type: "paragraph" }],
            type: "doc",
          },
        }}
      />,
    )

    expect(screen.getByRole("heading", { name: "Posttitle" })).toHaveClass(
      "mb-3",
    )
    expect(screen.getByTestId("post-hero-meta-row")).toBeVisible()
  })
})
