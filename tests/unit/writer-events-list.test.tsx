import { render, screen } from "@testing-library/react"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  router: {
    push: vi.fn(),
    refresh: vi.fn(),
  },
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
  useRouter: () => mocks.router,
}))

import { WriterEventsList } from "@/components/events/WriterEventsList"
import { AwardEventRoomStatus, AwardEventStatus } from "@prisma/client"

describe("WriterEventsList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders a link to the event room when joined (room is not null) and hides Edit room button", () => {
    const joinedEvent = {
      _count: { rooms: 3 },
      finalPost: null,
      id: "event-123",
      rooms: [
        { id: "room-456", status: "DRAFT" as AwardEventRoomStatus },
      ],
      status: "OPEN" as AwardEventStatus,
      title: "Holiday Writing Contest",
    }

    render(<WriterEventsList events={[joinedEvent]} />)

    // Check title link
    const titleLink = screen.getByRole("link", { name: "Holiday Writing Contest" })
    expect(titleLink).toBeInTheDocument()
    expect(titleLink).toHaveAttribute("href", "/dashboard/events/event-123")

    // Check that "Edit room" button is NOT rendered
    expect(screen.queryByRole("link", { name: /Edit room/i })).not.toBeInTheDocument()
    // Check that "Join" button is NOT rendered
    expect(screen.queryByRole("button", { name: /Join/i })).not.toBeInTheDocument()
  })

  it("renders the title as a plain header and shows the Join button when not joined", () => {
    const unjoinedEvent = {
      _count: { rooms: 0 },
      finalPost: null,
      id: "event-789",
      rooms: [],
      status: "OPEN" as AwardEventStatus,
      title: "Winter Special Event",
    }

    render(<WriterEventsList events={[unjoinedEvent]} />)

    // Title is plain text, not a link
    expect(screen.queryByRole("link", { name: "Winter Special Event" })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Winter Special Event" })).toBeInTheDocument()

    // Join button is rendered
    expect(screen.getByRole("button", { name: /Join|Tham gia/i })).toBeInTheDocument()
  })
})
