import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EventAnthologyTableOfContents } from "@/components/events/EventAnthologyTableOfContents"
import { EventAnthologyView } from "@/components/events/EventAnthologyView"

vi.mock("@/components/posts/PostBody", () => ({
  PostBody: () => <div>Entry body</div>,
}))

describe("EventAnthologyTableOfContents", () => {
  it("opens and closes writer outlines independently", async () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState").mockImplementation(() => {})
    const scrollIntoView = vi.fn()
    const writerBElement = document.createElement("section")
    writerBElement.id = "event-room-b"
    writerBElement.scrollIntoView = scrollIntoView
    document.body.appendChild(writerBElement)

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

    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "#event-room-b")
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      })
    })
    expect(screen.getByRole("link", { name: "Opening A" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Opening B" })).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", {
        name: "Thu gọn hoặc mở rộng các mục của Writer B",
      }),
    )

    expect(screen.getByRole("link", { name: "Opening A" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Opening B" })).not.toBeInTheDocument()

    writerBElement.remove()
    pushStateSpy.mockRestore()
  })

  it("keeps the controlled mobile contents panel in normal document flow", () => {
    render(
      <EventAnthologyTableOfContents
        collapsible
        headings={[{ id: "event-room-a", level: 1, text: "Writer A" }]}
      />,
    )

    expect(screen.queryByText("Mục lục")).toBeInTheDocument()
    expect(document.querySelector("details")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Mục lục" }))

    expect(screen.getByRole("button", { name: "Mục lục" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    expect(screen.getByTestId("mobile-event-toc-panel")).not.toHaveClass(
      "absolute",
    )

    fireEvent.click(screen.getByRole("link", { name: "Writer A" }))

    expect(screen.getByRole("button", { name: "Mục lục" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })
})

describe("EventAnthologyView", () => {
  it("keeps writer introductions out of the open author rail", () => {
    render(
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
                title: "Live draft",
              },
              status: "SUBMITTED",
              submittedContent: { content: [], type: "doc" },
              submittedPostId: "post-a",
              submittedPostTitle: "Submitted post",
              submittedWriterIntro: "Snapshot introduction.",
              writer: {
                avatarUrl: null,
                bio: null,
                name: "Writer A",
                username: "writer-a",
              },
              writerIntro: "Later room edit.",
            },
          ],
          title: "Collected perspectives",
        }}
      />,
    )

    expect(screen.queryByText("Snapshot introduction.")).not.toBeInTheDocument()
    expect(screen.queryByText("Later room edit.")).not.toBeInTheDocument()
  })

  it("keeps profile bio out of the open author rail", () => {
    render(
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
                title: "Submitted post",
              },
              status: "SUBMITTED",
              submittedContent: { content: [], type: "doc" },
              submittedPostId: "post-a",
              submittedPostTitle: "Submitted post",
              submittedWriterIntro: null,
              writer: {
                avatarUrl: null,
                bio: JSON.stringify({
                  content: [
                    {
                      content: [
                        { text: "Public profile introduction.", type: "text" },
                      ],
                      type: "paragraph",
                    },
                    {
                      content: [{ text: "Second profile line.", type: "text" }],
                      type: "paragraph",
                    },
                  ],
                  type: "doc",
                }),
                name: "Writer A",
                username: "writer-a",
              },
              writerIntro: null,
            },
          ],
          title: "Collected perspectives",
        }}
      />,
    )

    const contributorBlock = screen.getByTestId("event-contributor-block")
    expect(
      within(contributorBlock).queryByText("Public profile introduction."),
    ).not.toBeInTheDocument()
    expect(
      within(contributorBlock).queryByText("Second profile line."),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("event-contributor-header")).toHaveClass(
      "items-center",
      "text-center",
      "2xl:absolute",
      "2xl:w-32",
    )
    expect(screen.getByTestId("event-contributor-header")).not.toHaveClass(
      "border-b",
    )
  })

  it("scopes intentional blank-line spacing to event entry bodies", () => {
    render(
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
                content: {
                  content: [
                    {
                      content: [{ text: "Opening line.", type: "text" }],
                      type: "paragraph",
                    },
                    { type: "paragraph" },
                    {
                      content: [{ text: "New entry.", type: "text" }],
                      type: "paragraph",
                    },
                  ],
                  type: "doc",
                },
                id: "post-a",
                status: "DRAFT",
                title: "Submitted post",
              },
              status: "SUBMITTED",
              submittedContent: null,
              submittedPostId: null,
              submittedPostTitle: null,
              submittedWriterIntro: null,
              writer: {
                avatarUrl: null,
                bio: null,
                name: "Writer A",
                username: "writer-a",
              },
              writerIntro: null,
            },
          ],
          title: "Collected perspectives",
        }}
      />,
    )

    expect(screen.getByTestId("event-entry-content")).toHaveClass(
      "event-entry-content",
      "post-content",
    )
  })

  it("keeps the original desktop shell while letting the intro fill its card", () => {
    render(
      <EventAnthologyView
        event={{
          coverAlt: "A record of the event",
          coverUrl: "https://cdn.example.com/event-cover.jpg",
          intro: { content: [], type: "doc" },
          introText: "The complete introduction.",
          rooms: [],
          title: "Collected perspectives",
        }}
      />,
    )

    expect(screen.getByTestId("event-cover-alt")).toHaveTextContent(
      "A record of the event",
    )
    expect(screen.getByTestId("event-cover-alt").parentElement?.firstElementChild).toBe(
      screen.getByTestId("event-cover-alt"),
    )
    expect(screen.getByTestId("event-content-grid")).toHaveClass(
      "max-w-7xl",
      "lg:grid-cols-[minmax(0,1000px)]",
      "2xl:grid-cols-[minmax(0,1000px)_220px]",
    )
    expect(screen.getByTestId("event-hero-grid")).toHaveClass(
      "max-w-7xl",
      "lg:grid-cols-[minmax(0,1000px)]",
      "2xl:grid-cols-[minmax(0,1000px)_220px]",
      "2xl:pl-20",
    )
    expect(screen.getByTestId("event-hero-main-column")).toContainElement(
      screen.getByRole("heading", { name: "Collected perspectives" }),
    )
    expect(screen.getByText("The complete introduction.")).toHaveClass(
      "w-full",
      "max-w-none",
    )
    expect(screen.getByTestId("event-cover-bottom-fade").className).toContain(
      "bg-[linear-gradient(to_top",
    )
  })

  it("shows only explicitly selected event categories and tags", () => {
    const { rerender } = render(
      <EventAnthologyView
        event={{
          category: null,
          coverAlt: null,
          coverUrl: null,
          intro: { content: [], type: "doc" },
          introText: null,
          rooms: [],
          tags: [],
          title: "No metadata event",
        }}
      />,
    )

    expect(screen.queryByText("Event anthology")).not.toBeInTheDocument()

    rerender(
      <EventAnthologyView
        event={{
          category: { name: "Reviews", slug: "reviews" },
          coverAlt: null,
          coverUrl: null,
          intro: { content: [], type: "doc" },
          introText: null,
          rooms: [],
          tags: [{ tag: { name: "Direction", slug: "direction" } }],
          title: "Metadata event",
        }}
      />,
    )

    expect(screen.getByRole("link", { name: "Reviews" })).toHaveAttribute(
      "href",
      "/category/reviews",
    )
    expect(screen.getByRole("link", { name: "Direction" })).toHaveAttribute(
      "href",
      "/tag/direction",
    )
  })

  it("falls back to the plain introduction when the rich-text intro is empty", () => {
    render(
      <EventAnthologyView
        event={{
          coverAlt: null,
          coverUrl: null,
          intro: { content: [], type: "doc" },
          introText: "The introduction readers saw on the homepage.",
          rooms: [],
          title: "Collected perspectives",
        }}
      />,
    )

    expect(
      screen.getByText("The introduction readers saw on the homepage."),
    ).toBeVisible()
    expect(screen.getByTestId("event-intro-content")).toHaveClass(
      "text-[17px]",
      "leading-8",
      "sm:text-xl",
      "sm:leading-9",
    )
  })

  it("uses the same typography for rich and plain event introductions", () => {
    const { rerender } = render(
      <EventAnthologyView
        event={{
          coverAlt: null,
          coverUrl: null,
          intro: {
            content: [
              {
                content: [{ text: "Rich introduction.", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "doc",
          },
          introText: null,
          rooms: [],
          title: "Rich introduction event",
        }}
      />,
    )

    const richClasses = screen.getByTestId("event-intro-content").className

    rerender(
      <EventAnthologyView
        event={{
          coverAlt: null,
          coverUrl: null,
          intro: { content: [], type: "doc" },
          introText: "Plain introduction.",
          rooms: [],
          title: "Plain introduction event",
        }}
      />,
    )

    expect(screen.getByTestId("event-intro-content").className).toBe(
      richClasses,
    )
  })

  it("attributes the event to included contributors in the hero and credits", () => {
    const { container } = render(
      <EventAnthologyView
        event={{
          coverAlt: "Contributor collection cover",
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
            {
              id: "room-removed",
              order: 3,
              selectedPost: {
                content: { content: [], type: "doc" },
                id: "post-removed",
                status: "REMOVED",
                title: "Removed entry",
              },
              status: "SUBMITTED",
              writer: {
                avatarUrl: null,
                bio: "Removed profile bio.",
                name: "Removed Writer",
                username: "removed-writer",
              },
              writerIntro: "This should not be published.",
            },
          ],
          title: "Collected perspectives",
        }}
      />,
    )

    const heroCredits = screen.getByLabelText("Event contributors")
    expect(within(heroCredits).getByText("Writer A & Writer B")).toBeInTheDocument()
    expect(within(heroCredits).queryByText("Draft Writer")).not.toBeInTheDocument()
    expect(within(heroCredits).queryByText("Removed Writer")).not.toBeInTheDocument()

    const authorCredits = screen.getByLabelText("Tác giả bài viết")
    expect(screen.getByTestId("event-author-credits")).toHaveClass(
      "max-w-7xl",
      "lg:grid-cols-[minmax(0,1000px)]",
      "2xl:pl-20",
    )
    expect(within(authorCredits).getByText("Writer A")).toBeInTheDocument()
    expect(within(authorCredits).getByText("Writer B")).toBeInTheDocument()
    expect(within(authorCredits).getByText("Profile bio A.")).toBeInTheDocument()
    expect(within(authorCredits).queryByText("Draft Writer")).not.toBeInTheDocument()
    expect(within(authorCredits).queryByText("Removed Writer")).not.toBeInTheDocument()
    expect(container.querySelector("header")).not.toHaveClass("border-b")
    expect(screen.getByTestId("event-hero-transition").className).toContain(
      "bg-[linear-gradient(to_bottom",
    )
    expect(screen.getAllByTestId("event-contributor-block")).toHaveLength(2)
    expect(screen.getAllByTestId("event-contributor-block")[0].querySelector("h2")).toHaveTextContent(
      "Writer A",
    )
    expect(screen.getAllByTestId("event-contributor-block")[0]).toHaveClass(
      "relative",
      "scroll-mt-24",
    )
    expect(screen.getAllByTestId("event-contributor-block")[0].querySelector("img")).toHaveClass(
      "aspect-square",
      "h-28",
      "w-28",
      "sm:h-32",
      "sm:w-32",
      "rounded-full",
    )
    expect(screen.getAllByTestId("event-contributor-header")[0]).toHaveClass(
      "2xl:absolute",
      "2xl:left-[-9rem]",
      "text-center",
    )
    expect(screen.getByTestId("event-cover-alt").nextElementSibling).toContainElement(
      screen.getByRole("button", { name: "Mục lục" }),
    )
  })
})
