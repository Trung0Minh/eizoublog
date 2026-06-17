import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

import { EventRoomEditor } from "@/components/events/EventRoomEditor"

describe("EventRoomEditor", () => {
  it("renders a post picker instead of an event-local editor", () => {
    render(
      <EventRoomEditor
        eligiblePosts={[
          {
            id: "post-1",
            status: "DRAFT",
            title: "Draft pick",
            updatedAt: new Date("2026-06-17T00:00:00.000Z"),
          },
        ]}
        event={{
          finalPost: null,
          id: "event-1",
          status: "OPEN",
          title: "Awards",
        }}
        room={{
          id: "room-1",
          postId: null,
          selectedPost: null,
          status: "DRAFT",
          visibility: "PRIVATE",
          writerIntro: null,
        }}
      />,
    )

    expect(screen.getByLabelText("Submission post")).toBeVisible()
    expect(screen.getByRole("option", { name: /Draft pick/i })).toBeVisible()
    expect(screen.queryByTestId("event-editor")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Save/i })).toBeVisible()
    expect(screen.getByRole("button", { name: /Submit/i })).toBeVisible()
  })
})
