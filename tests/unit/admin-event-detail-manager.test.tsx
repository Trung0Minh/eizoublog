import { render, screen, waitFor } from "@testing-library/react"
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

  it("reorders rooms optimistically without a full refresh on success", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "event-1" } }), {
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
              _count: { comments: 0 },
              excludedAt: null,
              id: "room-1",
              order: 0,
              postId: "post-1",
              selectedPost: {
                id: "post-1",
                status: "DRAFT",
                title: "First pick",
              },
              status: "SUBMITTED",
              updatedAt: new Date("2026-06-17T00:00:00.000Z"),
              visibility: "PARTICIPANTS",
              writer: { name: "Mai", role: "WRITER", username: "mai" },
            },
            {
              _count: { comments: 0 },
              excludedAt: null,
              id: "room-2",
              order: 1,
              postId: "post-2",
              selectedPost: {
                id: "post-2",
                status: "PUBLISHED",
                title: "Second pick",
              },
              status: "SUBMITTED",
              updatedAt: new Date("2026-06-17T00:00:00.000Z"),
              visibility: "PARTICIPANTS",
              writer: { name: "Ren", role: "WRITER", username: "ren" },
            },
          ],
          status: "OPEN",
          title: "Awards",
        }}
      />,
    )

    await user.click(screen.getAllByTitle("Move down")[0])

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/events/event-1", {
        body: JSON.stringify({
          roomOrder: [
            { id: "room-2", order: 0 },
            { id: "room-1", order: 1 },
          ],
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
    })
    expect(routerMocks.refresh).not.toHaveBeenCalled()
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
