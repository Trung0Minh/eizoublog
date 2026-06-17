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

import { AdminEventDetailManager } from "@/components/events/AdminEventDetailManager"

describe("AdminEventDetailManager", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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
              writer: { name: "Mai", username: "mai" },
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
              writer: { name: "Mai", username: "mai" },
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
              writer: { name: "Ren", username: "ren" },
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
})
