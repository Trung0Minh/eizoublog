import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const analyticsMocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
}))

vi.mock("@/lib/analytics", () => ({
  trackEvent: analyticsMocks.trackEvent,
}))

import { CommentForm } from "@/components/comments/CommentForm"
import { CommentSection } from "@/components/comments/CommentSection"
import type { CommentWithReplies } from "@/types"

const topComment: CommentWithReplies = {
  author: null,
  authorName: "Mina",
  content: "<script>alert(1)</script>",
  createdAt: new Date("2024-04-01T00:00:00Z"),
  id: "comment-1",
  parentId: null,
  postId: "post-1",
  replies: [
    {
      author: null,
      authorName: "Ken",
      content: "A direct reply.",
      createdAt: new Date("2024-04-02T00:00:00Z"),
      id: "reply-1",
      parentId: "comment-1",
      postId: "post-1",
      status: "APPROVED",
    },
  ],
  status: "APPROVED",
}

describe("CommentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("posts a comment with privacy copy and success feedback", async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            ...topComment,
            content: "This changed my read of the scene.",
            replies: undefined,
          },
        }),
        { status: 201 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(
      <CommentForm
        onSuccess={onSuccess}
        postId="post-1"
        postSlug="frieren-memory"
      />,
    )

    expect(screen.getByText("Không hiển thị công khai")).toBeVisible()

    await user.type(screen.getByLabelText("Tên *"), "Mina")
    await user.type(screen.getByLabelText("Email *"), "mina@example.com")
    await user.type(
      screen.getByLabelText("Bình luận *"),
      "This changed my read of the scene.",
    )
    await user.click(screen.getByRole("button", { name: "Đăng bình luận" }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "This changed my read of the scene.",
          replies: [],
        }),
      )
    })
    expect(await screen.findByText("Đã đăng bình luận.")).toBeVisible()
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith(
      "comment_submitted",
      { postSlug: "frieren-memory" },
    )

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    expect(body).toEqual({
      authorEmail: "mina@example.com",
      authorName: "Mina",
      content: "This changed my read of the scene.",
      notifyReply: true,
      postId: "post-1",
    })
  })

  it("stacks identity fields and full-width actions on mobile", () => {
    render(<CommentForm onSuccess={vi.fn()} postId="post-1" />)

    const identityGrid = screen.getByLabelText("Tên *").closest(".grid")
    if (!identityGrid) {
      throw new Error("Identity grid not found")
    }

    expect(identityGrid).toHaveClass("grid-cols-1", "md:grid-cols-2")
    expect(screen.getByRole("button", { name: "Đăng bình luận" })).toHaveClass(
      "h-[38px]",
      "px-5",
      "bg-button-bg",
      "text-button-text",
    )
  })
})

describe("CommentSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders comments as plain text and never displays email addresses", () => {
    const { container } = render(
      <CommentSection
        initialComments={[topComment]}
        postId="post-1"
        postSlug="frieren-memory"
      />,
    )

    expect(screen.getByRole("heading", { name: "Bình luận" })).toBeVisible()
    expect(screen.getByText("2 bình luận")).toBeVisible()
    expect(screen.getByText("<script>alert(1)</script>")).toBeVisible()
    expect(container.querySelector("script")).toBeNull()
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Trả lời bình luận của Mina" }),
    ).toHaveClass("text-[12px]", "text-text-tertiary")
    expect(screen.getByText("2 bình luận")).toHaveClass("text-text-secondary")
  })

  it("sorts top-level comments and replies latest first", () => {
    render(
      <CommentSection
        initialComments={[
          topComment,
          {
            author: null,
            authorName: "Rin",
            content: "Newest top-level comment.",
            createdAt: new Date("2024-04-04T00:00:00Z"),
            id: "comment-2",
            parentId: null,
            postId: "post-1",
            replies: [],
            status: "APPROVED",
          },
        ]}
        postId="post-1"
        postSlug="frieren-memory"
      />,
    )

    const newest = screen.getByText("Newest top-level comment.")
    const oldest = screen.getByText("<script>alert(1)</script>")

    expect(
      newest.compareDocumentPosition(oldest) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("adds a successful reply under the selected parent comment", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            author: null,
            authorName: "Ryu",
            content: "That is the line I noticed too.",
            createdAt: new Date("2024-04-03T00:00:00Z"),
            id: "reply-2",
            parentId: "comment-1",
            postId: "post-1",
            status: "APPROVED",
          },
        }),
        { status: 201 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(
      <CommentSection
        initialComments={[topComment]}
        postId="post-1"
        postSlug="frieren-memory"
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Trả lời bình luận của Mina" }),
    )

    const replyForm = screen.getByRole("form", { name: "Trả lời Mina" })
    expect(
      within(replyForm).queryByRole("button", { name: "Hủy" }),
    ).not.toBeInTheDocument()
    await user.type(within(replyForm).getByLabelText("Tên *"), "Rei")
    await user.type(
      within(replyForm).getByLabelText("Email *"),
      "rei@example.com",
    )
    await user.type(
      within(replyForm).getByLabelText("Bình luận *"),
      "That is the line I noticed too.",
    )
    await user.click(within(replyForm).getByRole("button", { name: "Đăng trả lời" }))

    expect(
      await screen.findByText("That is the line I noticed too."),
    ).toBeVisible()
    await waitFor(() => {
      expect(
        screen.queryByRole("form", { name: "Trả lời Mina" }),
      ).not.toBeInTheDocument()
    })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    expect(body.parentId).toBe("comment-1")
  })
})
