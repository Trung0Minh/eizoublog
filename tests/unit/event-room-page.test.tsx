import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  joinAwardEvent: vi.fn(),
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
    awardEventRoomComment: {
      count: vi.fn(),
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
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@/lib/awardEventService", () => ({
  joinAwardEvent: mocks.joinAwardEvent,
}))

import DashboardEventRoomPage from "@/app/(writer)/dashboard/events/[id]/page"

describe("DashboardEventRoomPage (Page A)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({
      user: { id: "writer-1", name: "Alice", role: "WRITER", avatarUrl: null },
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
      title: "Awards Event",
    })
    mocks.prisma.awardEventRoomComment.count.mockResolvedValue(0)
    mocks.prisma.awardEventRoom.findMany.mockResolvedValue([])
    mocks.prisma.post.findMany.mockResolvedValue([
      {
        id: "post-1",
        status: "DRAFT",
        title: "My submission",
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        version: 1,
      },
    ])
  })

  it("renders the event overview and participant status", async () => {
    mocks.prisma.awardEventRoom.findMany.mockResolvedValue([
      {
        id: "room-1",
        postId: "post-1",
        selectedPost: {
          id: "post-1",
          status: "DRAFT",
          title: "My submission",
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        status: "DRAFT",
        visibility: "PRIVATE",
        writer: { id: "writer-1", name: "Alice", username: "alice", avatarUrl: null },
        writerIntro: null,
      },
    ])

    render(
      await DashboardEventRoomPage({
        params: Promise.resolve({ id: "event-1" }),
      }),
    )

    expect(screen.getByText("Awards Event")).toBeVisible()
    expect(screen.getByText("Đang mở")).toHaveClass("text-emerald-700")
    expect(screen.getByRole("link", { name: "Quay lại danh sách sự kiện" })).toHaveAttribute(
      "href",
      "/dashboard/events",
    )
    expect(screen.getByText("Alice")).toBeVisible()
    expect(screen.getByText("My submission")).toBeVisible()
    expect(screen.getByRole("button", { name: "Nộp bài dự thi" })).toBeVisible()
    expect(screen.getByRole("link", { name: "Xem trước bài dự thi" })).toHaveAttribute(
      "href",
      "/dashboard/preview/post-1",
    )
    expect(screen.queryByRole("link", { name: "View feedback" })).not.toBeInTheDocument()
  })

  it("joins the event when the writer has no room yet", async () => {
    mocks.prisma.awardEvent.findUnique
      .mockResolvedValueOnce({
        finalPost: null,
        id: "event-1",
        rooms: [],
        status: "OPEN",
        title: "Awards Event",
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
        title: "Awards Event",
      })

    render(
      await DashboardEventRoomPage({
        params: Promise.resolve({ id: "event-1" }),
      }),
    )

    expect(mocks.joinAwardEvent).toHaveBeenCalledWith("event-1", "writer-1")
  })

  it("displays other participants and view button for shared posts", async () => {
    mocks.prisma.awardEventRoom.findMany.mockResolvedValue([
      {
        id: "room-1",
        postId: null,
        selectedPost: null,
        status: "DRAFT",
        visibility: "PRIVATE",
        writer: { id: "writer-1", name: "Alice", username: "alice", avatarUrl: null },
        writerIntro: null,
      },
      {
        id: "room-3",
        postId: "post-3",
        selectedPost: {
          id: "post-3",
          status: "DRAFT",
          title: "Shared pick",
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        status: "SUBMITTED",
        visibility: "PARTICIPANTS",
        writer: { id: "writer-2", name: "Mai", username: "mai", avatarUrl: null },
        writerIntro: null,
      },
    ])

    const { container } = render(
      await DashboardEventRoomPage({
        params: Promise.resolve({ id: "event-1" }),
      }),
    )

    expect(screen.getByText("Mai")).toBeVisible()
    expect(screen.getByText("Shared pick")).toBeVisible()
    expect(
      container.querySelector('time[dateTime="2026-01-01T00:00:00.000Z"]'),
    ).toHaveAttribute("dateTime", "2026-01-01T00:00:00.000Z")
    expect(screen.getByRole("link", { name: /Xem bài dự thi của Mai/i })).toHaveAttribute(
      "href",
      "/dashboard/events/event-1/rooms/room-3",
    )
  })
})
