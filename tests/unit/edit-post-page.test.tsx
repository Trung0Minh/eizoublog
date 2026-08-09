import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("notFound")
  }),
  postEditor: vi.fn(),
  prisma: {
    post: {
      findUnique: vi.fn(),
    },
  },
  referenceData: vi.fn(),
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
vi.mock("@/lib/queries", () => ({
  getCachedEditorReferenceData: mocks.referenceData,
}))
vi.mock("@/components/posts/PostEditor", () => ({
  PostEditor: (props: {
    eventAssignment?: {
      eventId: string
      eventStatus: "OPEN" | "CLOSED"
      eventTitle: string
      visibility: "PRIVATE" | "PARTICIPANTS"
    }
  }) => {
    mocks.postEditor(props)
    return <div data-testid="post-editor" />
  },
}))

import EditPostPage from "@/app/(writer)/dashboard/edit/[id]/page"

const basePost = {
  authorId: "writer-1",
  awardEventRooms: [],
  categoryId: null,
  coAuthors: [],
  content: { content: [], type: "doc" },
  contentText: "Body",
  coverAlt: null,
  coverUrl: null,
  draftVisibility: "PRIVATE",
  excerpt: "Excerpt",
  excerptContent: null,
  id: "post-1",
  status: "DRAFT",
  tags: [],
  title: "Event entry",
  version: 3,
}

describe("EditPostPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.referenceData.mockResolvedValue({ categories: [], writers: [] })
    mocks.prisma.post.findUnique.mockResolvedValue(basePost)
  })

  it("passes the selected event room to the post editor", async () => {
    mocks.prisma.post.findUnique.mockResolvedValue({
      ...basePost,
      awardEventRooms: [
        {
          event: { id: "event-1", status: "OPEN", title: "Eizou Awards" },
          visibility: "PARTICIPANTS",
        },
      ],
    })

    render(
      await EditPostPage({ params: Promise.resolve({ id: "post-1" }) }),
    )

    expect(screen.getByTestId("post-editor")).toBeVisible()
    expect(mocks.postEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        eventAssignment: {
          eventId: "event-1",
          eventStatus: "OPEN",
          eventTitle: "Eizou Awards",
          visibility: "PARTICIPANTS",
        },
      }),
    )
    expect(mocks.prisma.post.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          awardEventRooms: {
            select: {
              event: { select: { id: true, status: true, title: true } },
              visibility: true,
            },
            take: 1,
            where: { writerId: "writer-1" },
          },
        }),
      }),
    )
  })

  it("keeps the normal editor action when the post has no event room", async () => {
    render(
      await EditPostPage({ params: Promise.resolve({ id: "post-1" }) }),
    )

    expect(mocks.postEditor).toHaveBeenCalledWith(
      expect.objectContaining({ eventAssignment: undefined }),
    )
  })
})
