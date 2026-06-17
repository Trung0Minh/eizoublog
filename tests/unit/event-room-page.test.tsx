import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  joinAwardEvent: vi.fn(),
  normalizeAwardEventContent: vi.fn((content: unknown) => content),
  notFound: vi.fn(() => {
    throw new Error("notFound")
  }),
  prisma: {
    awardEvent: {
      findUnique: vi.fn(),
    },
    awardEventRoom: {
      findMany: vi.fn(),
    },
    post: {
      findMany: vi.fn(),
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
vi.mock("@/lib/awardEventService", () => ({
  joinAwardEvent: mocks.joinAwardEvent,
  normalizeAwardEventContent: mocks.normalizeAwardEventContent,
}))
vi.mock("@/components/events/EventRoomEditor", () => ({
  EventRoomEditor: ({
    eligiblePosts,
    room,
    sharedRooms,
  }: {
    eligiblePosts: unknown[]
    room: { id: string }
    sharedRooms: { selectedPost?: { title: string } | null }[]
  }) => (
    <div>
      <div>room:{room.id}</div>
      <div>eligible:{eligiblePosts.length}</div>
      <div>shared:{sharedRooms.length}</div>
      {sharedRooms.map((sharedRoom) => (
        <div key={sharedRoom.selectedPost?.title}>
          sharedPost:{sharedRoom.selectedPost?.title}
        </div>
      ))}
    </div>
  ),
}))

import DashboardEventRoomPage from "@/app/(writer)/dashboard/events/[id]/page"

const content = {
  content: [{ type: "paragraph" }],
  type: "doc",
}

describe("DashboardEventRoomPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({
      user: { id: "writer-1", role: "WRITER" },
    })
    mocks.prisma.awardEvent.findUnique.mockResolvedValue({
      finalPost: null,
      id: "event-1",
      rooms: [
        {
          id: "room-1",
          postId: null,
          selectedPost: null,
          status: "DRAFT",
          visibility: "PRIVATE",
          writerIntro: null,
        },
      ],
      status: "OPEN",
      title: "Awards",
    })
    mocks.prisma.awardEventRoom.findMany.mockResolvedValue([])
    mocks.prisma.post.findMany.mockResolvedValue([
      { id: "post-1", status: "DRAFT", title: "Draft pick" },
    ])
  })

  it("renders an existing writer room", async () => {
    render(
      await DashboardEventRoomPage({
        params: Promise.resolve({ id: "event-1" }),
      }),
    )

    expect(screen.getByText("Awards")).toBeVisible()
    expect(screen.getByText("room:room-1")).toBeVisible()
    expect(screen.getByText("eligible:1")).toBeVisible()
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith({
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        status: true,
        title: true,
        updatedAt: true,
      },
      where: {
        authorId: "writer-1",
        status: { in: ["DRAFT", "PUBLISHED"] },
      },
    })
  })

  it("joins the event before rendering when the writer has no room yet", async () => {
    mocks.prisma.awardEvent.findUnique
      .mockResolvedValueOnce({
        finalPost: null,
        id: "event-1",
        rooms: [],
        status: "OPEN",
        title: "Awards",
      })
      .mockResolvedValueOnce({
        finalPost: null,
        id: "event-1",
        rooms: [
          {
            id: "room-2",
            postId: null,
            selectedPost: null,
            status: "DRAFT",
            visibility: "PRIVATE",
            writerIntro: null,
          },
        ],
        status: "OPEN",
        title: "Awards",
      })

    render(
      await DashboardEventRoomPage({
        params: Promise.resolve({ id: "event-1" }),
      }),
    )

    expect(mocks.joinAwardEvent).toHaveBeenCalledWith("event-1", "writer-1")
    expect(screen.getByText("room:room-2")).toBeVisible()
  })

  it("passes shared participant submissions with selected post content", async () => {
    mocks.prisma.awardEventRoom.findMany.mockResolvedValue([
      {
        comments: [],
        id: "room-3",
        postId: "post-3",
        selectedPost: {
          content,
          contentText: "Shared body",
          id: "post-3",
          status: "DRAFT",
          title: "Shared pick",
        },
        status: "SUBMITTED",
        writer: { name: "Mai", username: "mai" },
        writerIntro: null,
      },
    ])

    render(
      await DashboardEventRoomPage({
        params: Promise.resolve({ id: "event-1" }),
      }),
    )

    expect(screen.getByText("sharedPost:Shared pick")).toBeVisible()
  })
})
