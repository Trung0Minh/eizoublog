import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EventAnthologyTableOfContents } from "@/components/events/EventAnthologyTableOfContents"
import { EventAnthologyView } from "@/components/events/EventAnthologyView"

vi.mock("@/components/posts/PostBody", () => ({
  PostBody: () => <div>Entry body</div>,
}))

describe("EventAnthologyTableOfContents", () => {
  it("opens and closes writer outlines independently", () => {
    render(
      <EventAnthologyTableOfContents
        headings={[
          { id: "event-room-a", level: 1, text: "Writer A" },
          { id: "event-room-a-opening", level: 2, text: "Opening A" },
          { id: "event-room-b", level: 1, text: "Writer B" },
          { id: "event-room-b-opening", level: 2, text: "Opening B" },
        ]}
      />,
    )

    expect(screen.getByRole("link", { name: "Opening A" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Opening B" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("link", { name: "Writer B" }))

    expect(screen.getByRole("link", { name: "Opening A" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Opening B" })).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Writer B sections" }),
    )

    expect(screen.getByRole("link", { name: "Opening A" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Opening B" })).not.toBeInTheDocument()
  })
})

describe("EventAnthologyView", () => {
  it("attributes the event to included contributors in the hero and credits", () => {
    const { container } = render(
      <EventAnthologyView
        event={{
          coverAlt: null,
          coverUrl: null,
          intro: { content: [], type: "doc" },
          introText: null,
          rooms: [
            {
              id: "room-a",
              order: 0,
              selectedPost: {
                content: { content: [], type: "doc" },
                id: "post-a",
                status: "DRAFT",
                title: "Entry A",
              },
              status: "SUBMITTED",
              writer: {
                avatarUrl: "/writer-a.png",
                bio: "Profile bio A.",
                name: "Writer A",
                username: "writer-a",
              },
              writerIntro: "A short introduction.",
            },
            {
              id: "room-b",
              order: 1,
              selectedPost: {
                content: { content: [], type: "doc" },
                id: "post-b",
                status: "DRAFT",
                title: "Entry B",
              },
              status: "SUBMITTED",
              writer: {
                avatarUrl: null,
                bio: "Profile bio B.",
                name: "Writer B",
                username: "writer-b",
              },
              writerIntro: "Another short introduction.",
            },
            {
              id: "room-draft",
              order: 2,
              selectedPost: {
                content: { content: [], type: "doc" },
                id: "post-draft",
                status: "DRAFT",
                title: "Draft entry",
              },
              status: "DRAFT",
              writer: {
                avatarUrl: null,
                bio: null,
                name: "Draft Writer",
                username: "draft-writer",
              },
              writerIntro: null,
            },
          ],
          title: "Collected perspectives",
        }}
      />,
    )

    const heroCredits = screen.getByLabelText("Event contributors")
    expect(within(heroCredits).getByText("Writer A & Writer B")).toBeInTheDocument()
    expect(within(heroCredits).queryByText("Draft Writer")).not.toBeInTheDocument()

    const authorCredits = screen.getByLabelText("Tác giả bài viết")
    expect(within(authorCredits).getByText("Writer A")).toBeInTheDocument()
    expect(within(authorCredits).getByText("Writer B")).toBeInTheDocument()
    expect(within(authorCredits).getByText("Profile bio A.")).toBeInTheDocument()
    expect(within(authorCredits).queryByText("Draft Writer")).not.toBeInTheDocument()
    expect(container.querySelector("header")).not.toHaveClass("border-b")
    expect(screen.getByTestId("event-hero-transition")).toHaveClass(
      "bg-gradient-to-b",
      "from-background",
      "to-transparent",
    )
  })
})
