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
    room,
    sharedRooms,
  }: {
    room: { id: string }
    sharedRooms: unknown[]
  }) => (
    <div>
      <div>room:{room.id}</div>
      <div>shared:{sharedRooms.length}</div>
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
          content,
          contentText: "",
          id: "room-1",
          status: "DRAFT",
          visibility: "PRIVATE",
          writerIntro: null,
        },
      ],
      status: "OPEN",
      title: "Awards",
    })
    mocks.prisma.awardEventRoom.findMany.mockResolvedValue([])
  })

  it("renders an existing writer room", async () => {
    render(
      await DashboardEventRoomPage({
        params: Promise.resolve({ id: "event-1" }),
      }),
    )

    expect(screen.getByText("Awards")).toBeVisible()
    expect(screen.getByText("room:room-1")).toBeVisible()
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
            content,
            contentText: "",
            id: "room-2",
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
})
