import type { ReactNode } from "react"

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("notFound")
  }),
  prisma: {
    awardEventRoom: {
      findUnique: vi.fn(),
    },
    awardEventRoomComment: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    postReviewRequest: {
      findFirst: vi.fn(),
    },
  },
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
  session: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}))

vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@/components/posts/PostBody", () => ({
  PostBody: () => <div data-testid="post-body" />,
}))
vi.mock("@/components/posts/PostContentFrame", () => ({
  PostContentFrame: ({ children }: { children: ReactNode }) => (
    <div data-testid="post-content-frame">{children}</div>
  ),
}))
vi.mock("@/components/posts/TableOfContents", () => ({
  TableOfContents: () => <nav data-testid="toc" />,
}))
vi.mock("@/components/events/RoomFeedbackSection", () => ({
  RoomFeedbackSection: () => <section data-testid="room-feedback" />,
}))
vi.mock("@/components/posts/PostReviewActions", () => ({
  PostReviewActions: ({ requestId }: { requestId: string }) => (
    <div data-testid="post-review-actions">{requestId}</div>
  ),
}))

import RoomDetailPage from "@/app/(writer)/dashboard/events/[id]/rooms/[roomId]/page"

const emptyDoc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Body" }] }],
}

describe("RoomDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({
      user: { id: "writer-1", name: "Alice", role: "WRITER" },
    })
    mocks.prisma.awardEventRoom.findUnique.mockResolvedValue({
      event: {
        id: "event-1",
        title: "Awards Event",
      },
      eventId: "event-1",
      id: "room-1",
      selectedPost: {
        content: emptyDoc,
        coverUrl: null,
        id: "post-1",
        status: "DRAFT",
        title: "Submitted Post",
      },
      visibility: "PRIVATE",
      writer: {
        avatarUrl: null,
        bio: null,
        id: "writer-1",
        name: "Alice",
        username: "alice",
      },
      writerId: "writer-1",
    })
    mocks.prisma.awardEventRoomComment.findMany.mockResolvedValue([
      {
        author: { avatarUrl: null, name: "Mai", username: "mai" },
        authorId: "writer-2",
        content: "Feedback",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        id: "comment-1",
        isPrivate: false,
      },
    ])
    mocks.prisma.awardEventRoomComment.updateMany.mockResolvedValue({ count: 0 })
    mocks.prisma.postReviewRequest.findFirst.mockResolvedValue(null)
  })

  it("does not mark event feedback read just because the owner opens the room", async () => {
    render(
      await RoomDetailPage({
        params: Promise.resolve({ id: "event-1", roomId: "room-1" }),
      }),
    )

    expect(screen.getByText("Submitted Post")).toBeVisible()
    expect(mocks.prisma.awardEventRoomComment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { roomId: "room-1" },
      }),
    )
    expect(mocks.prisma.awardEventRoomComment.updateMany).not.toHaveBeenCalled()
  })

  it("renders pending event post review actions for admins", async () => {
    mocks.session.mockResolvedValue({
      user: { id: "admin-1", name: "Admin", role: "ADMIN" },
    })
    mocks.prisma.postReviewRequest.findFirst.mockResolvedValue({
      id: "review-1",
      snapshot: {
        authorId: "writer-1",
        categoryId: null,
        coAuthorIds: [],
        content: emptyDoc,
        contentText: "Body",
        coverAlt: null,
        coverUrl: null,
        draftVisibility: "PRIVATE",
        excerpt: null,
        excerptContent: null,
        publishedAt: null,
        removedAt: null,
        removedFromStatus: null,
        slug: "submitted-post",
        status: "PUBLISHED",
        tagIds: [],
        title: "Review submission",
        version: 2,
      },
    })

    render(
      await RoomDetailPage({
        params: Promise.resolve({ id: "event-1", roomId: "room-1" }),
        searchParams: Promise.resolve({ reviewRequest: "review-1" }),
      }),
    )

    expect(screen.getByText("Review submission")).toBeVisible()
    expect(screen.getByTestId("post-review-actions")).toHaveTextContent("review-1")
  })
})
