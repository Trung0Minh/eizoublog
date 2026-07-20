import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RoomFeedbackSection } from "@/components/events/RoomFeedbackSection"

describe("RoomFeedbackSection", () => {
  it("renders feedback author avatars when accounts have one", () => {
    render(
      <RoomFeedbackSection
        eventId="event-1"
        roomId="room-1"
        initialComments={[
          {
            author: {
              avatarUrl: "https://cdn.example.com/avatars/mina.png",
              name: "Mina",
              username: "mina",
            },
            content: "Great structure.",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            id: "comment-1",
            isPrivate: false,
          },
        ]}
      />,
    )

    expect(screen.getByRole("img", { name: "Mina" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/avatars/mina.png",
    )
  })
})
