import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const routerMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    title?: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}))
vi.mock("@/components/posts/CoverImageUpload", () => ({
  CoverImageUpload: ({
    onChange,
    value,
  }: {
    onChange: (url: string) => void
    value: string
  }) => (
    <div>
      <span>{value}</span>
      <button onClick={() => onChange("https://cdn.example.com/event-cover.jpg")}>
        Set event cover
      </button>
    </div>
  ),
}))

import { AdminEventDetailManager } from "@/components/events/AdminEventDetailManager"

describe("AdminEventDetailManager", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("saves optional category, tags, cover, and cover alt without defaults", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "event-1" } }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(
      <AdminEventDetailManager
        categories={[
          { id: "category-1", name: "Animation analysis" },
          { id: "category-2", name: "Reviews" },
        ]}
        event={{
          categoryId: null,
          coverAlt: null,
          coverUrl: null,
          finalPost: null,
          id: "event-1",
          introText: null,
          rooms: [],
          status: "OPEN",
          tags: [],
          title: "Awards",
        }}
        tags={[
          { id: "tag-1", name: "Sakuga" },
          { id: "tag-2", name: "Direction" },
        ]}
      />,
    )

    expect(screen.getByLabelText("Event category")).toHaveValue("")
    expect(screen.getByRole("button", { name: "Sakuga" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )

    await user.selectOptions(screen.getByLabelText("Event category"), "category-2")
    await user.click(screen.getByRole("button", { name: "Direction" }))
    await user.click(screen.getByRole("button", { name: "Set event cover" }))
    await user.type(screen.getByLabelText("Event cover alt text"), "Event key art")
    await user.click(screen.getByRole("button", { name: "Save article details" }))

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/events/event-1", {
      body: JSON.stringify({
        categoryId: "category-2",
        coverAlt: "Event key art",
        coverUrl: "https://cdn.example.com/event-cover.jpg",
        tagIds: ["tag-2"],
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
  })

  it("shows selected post metadata for event submissions", () => {
    render(
      <AdminEventDetailManager
        event={{
          finalPost: null,
          id: "event-1",
          introText: null,
          rooms: [
            {
              _count: { comments: 2 },
              excludedAt: null,
              id: "room-1",
              order: 0,
              postId: "post-1",
              selectedPost: {
                id: "post-1",
                status: "DRAFT",
                title: "Draft event pick",
              },
              status: "SUBMITTED",
              updatedAt: new Date("2026-06-17T00:00:00.000Z"),
              visibility: "PARTICIPANTS",
              writer: { name: "Mai", role: "WRITER", username: "mai" },
            },
          ],
          status: "OPEN",
          title: "Awards",
        }}
      />,
    )

    expect(screen.getByText("Draft event pick")).toBeVisible()
    expect(screen.getByText(/DRAFT source post/i)).toBeVisible()
    expect(screen.getByText(/2 feedback comments/i)).toBeVisible()
    expect(screen.getByTitle("Preview selected post")).toHaveAttribute(
      "href",
      "/dashboard/preview/post-1",
    )
    expect(screen.getByRole("link", { name: "Preview final event" })).toHaveAttribute(
      "href",
      "/admin/events/event-1/preview",
    )
    expect(screen.getByTestId("event-article-settings-column")).toContainElement(
      screen.getByRole("heading", { name: "Event introduction" }),
    )
    expect(screen.getByTestId("event-submissions-column")).toContainElement(
      screen.getByText("Draft event pick"),
    )
  })

  it("shows submitted snapshot metadata even when the live selected post relation is missing", () => {
    render(
      <AdminEventDetailManager
        event={{
          finalPost: null,
          id: "event-1",
          introText: null,
          rooms: [
            {
              _count: { comments: 1 },
              excludedAt: null,
              id: "room-1",
              order: 0,
              postId: null,
              selectedPost: null,
              submittedPostId: "post-1",
              submittedPostTitle: "Snapshot pick",
              status: "SUBMITTED",
              updatedAt: new Date("2026-06-17T00:00:00.000Z"),
              visibility: "PARTICIPANTS",
              writer: { name: "Mai", role: "WRITER", username: "mai" },
            },
          ],
          status: "OPEN",
          title: "Awards",
        }}
      />,
    )

    expect(screen.getByText("Snapshot pick")).toBeVisible()
    expect(screen.getByText(/SUBMITTED source post/i)).toBeVisible()
    expect(screen.queryByText("No source post selected yet.")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Preview selected post" })).toHaveAttribute(
      "href",
      "/dashboard/preview/post-1",
    )
  })

  it("renders the sortable submissions region without legacy move buttons", () => {
    render(
      <AdminEventDetailManager
        event={{
          finalPost: null,
          id: "event-1",
          introText: null,
          rooms: [],
          status: "OPEN",
          title: "Awards",
        }}
      />,
    )

    expect(screen.getByTestId("event-submissions-scroll")).toBeVisible()
    expect(screen.queryByTitle("Move up")).not.toBeInTheDocument()
    expect(screen.queryByTitle("Move down")).not.toBeInTheDocument()
  })

  it("shows a plain publication status and a text-only publication action", () => {
    const { rerender } = render(
      <AdminEventDetailManager
        event={{
          finalPost: { slug: "awards", status: "PUBLISHED" },
          id: "event-1",
          introText: null,
          rooms: [],
          status: "OPEN",
          title: "Awards",
        }}
      />,
    )

    const publishedStatus = screen.getByText("Published")
    const unpublishButton = screen.getByRole("button", {
      name: "Unpublish event article",
    })

    expect(publishedStatus).toHaveClass("bg-emerald-500/10")
    expect(screen.queryByText("Article: Published")).not.toBeInTheDocument()
    expect(unpublishButton).toHaveClass("bg-subtle-bg")
    expect(unpublishButton.querySelector("svg")).toBeNull()

    rerender(
      <AdminEventDetailManager
        event={{
          finalPost: { slug: "awards", status: "DRAFT" },
          id: "event-1",
          introText: null,
          rooms: [],
          status: "OPEN",
          title: "Awards",
        }}
      />,
    )

    expect(screen.getByText("Unpublished")).toBeVisible()
    expect(screen.getByRole("button", { name: "Publish event article" })).toHaveClass(
      "bg-emerald-600",
    )
  })

  it("shuffles through the event shuffle endpoint and applies the returned order", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            rooms: [
              { id: "room-a", order: 0 },
              { id: "room-c", order: 1 },
              { id: "room-b", order: 2 },
            ],
          },
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const room = (
      id: string,
      order: number,
      name: string,
      status: "DRAFT" | "SUBMITTED",
    ) => ({
      _count: { comments: 0 },
      excludedAt: null,
      id,
      order,
      postId: `${id}-post`,
      selectedPost: { id: `${id}-post`, status: "DRAFT" as const, title: `${name} pick` },
      status,
      updatedAt: new Date("2026-06-17T00:00:00.000Z"),
      visibility: "PARTICIPANTS" as const,
      writer: { name, role: "WRITER" as const, username: name.toLowerCase() },
    })

    render(
      <AdminEventDetailManager
        event={{
          finalPost: null,
          id: "event-1",
          introText: null,
          rooms: [
            room("room-a", 0, "A", "DRAFT"),
            room("room-b", 1, "B", "SUBMITTED"),
            room("room-c", 2, "C", "DRAFT"),
          ],
          status: "OPEN",
          title: "Awards",
        }}
      />,
    )

    const shuffleButton = screen.getByRole("button", { name: "Shuffle submissions" })
    const submissionOrder = () =>
      screen
        .getAllByTestId(/^event-submission-room-/)
        .map((submission) => submission.dataset.testid)

    fireEvent.click(shuffleButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/events/event-1/shuffle",
        expect.objectContaining({
          method: "POST",
        }),
      )
    })

    await waitFor(() => {
      expect(submissionOrder()).toEqual([
        "event-submission-room-a",
        "event-submission-room-c",
        "event-submission-room-b",
      ])
    })
  })

  it("removes a participant room after confirmation without touching source posts", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { message: "Participant removed" } }), {
        status: 200,
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(
      <AdminEventDetailManager
        event={{
          finalPost: null,
          id: "event-1",
          introText: null,
          rooms: [
            {
              _count: { comments: 2 },
              excludedAt: null,
              id: "room-1",
              order: 0,
              postId: "post-1",
              selectedPost: { id: "post-1", status: "DRAFT", title: "Mai pick" },
              status: "SUBMITTED",
              updatedAt: new Date("2026-06-17T00:00:00.000Z"),
              visibility: "PARTICIPANTS",
              writer: { name: "Mai", role: "WRITER", username: "mai" },
            },
          ],
          status: "OPEN",
          title: "Awards",
        }}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Remove Mai from event" }))
    const dialog = screen.getByRole("dialog", { name: "Remove participant?" })
    expect(dialog).toHaveTextContent("source post will not be deleted")
    await user.click(within(dialog).getByRole("button", { name: "Remove participant" }))

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/events/event-1/rooms/room-1",
      { method: "DELETE" },
    )
    await waitFor(() => {
      expect(screen.queryByTestId("event-submission-room-1")).not.toBeInTheDocument()
    })
  })

  it("lets the admin exclude a submission from the final anthology", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "event-1" } }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(
      <AdminEventDetailManager
        event={{
          finalPost: null,
          id: "event-1",
          introText: null,
          rooms: [
            {
              _count: { comments: 0 },
              excludedAt: null,
              id: "room-1",
              order: 0,
              postId: "post-1",
              selectedPost: { id: "post-1", status: "DRAFT", title: "Pick" },
              status: "SUBMITTED",
              updatedAt: new Date("2026-06-17T00:00:00.000Z"),
              visibility: "PARTICIPANTS",
              writer: { name: "Mai", role: "WRITER", username: "mai" },
            },
          ],
          status: "OPEN",
          title: "Awards",
        }}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Exclude from final event" }))

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/events/event-1", {
      body: JSON.stringify({ roomExclusion: { excluded: true, id: "room-1" } }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
  })
})
