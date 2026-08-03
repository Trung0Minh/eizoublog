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
            version: 1,
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
          submittedPostId: null,
          submittedPostVersion: null,
          visibility: "PRIVATE",
        }}
      />,
    )

    expect(screen.getByLabelText("Bài viết được chọn")).toBeVisible()
    expect(screen.getByRole("option", { name: /Draft pick/i })).toBeVisible()
    expect(screen.queryByTestId("event-editor")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Gửi bài/i })).toBeVisible()
    expect(screen.getByTestId("submission-header")).toContainElement(
      screen.getByRole("button", { name: /Gửi bài/i }),
    )
    expect(screen.getByTestId("submission-header")).toHaveClass(
      "flex-col",
      "sm:flex-row",
    )
    expect(screen.getByTestId("submission-heading-row")).toHaveClass(
      "items-start",
      "sm:items-center",
    )
    expect(screen.queryByRole("button", { name: /Lưu/i })).not.toBeInTheDocument()
    const primaryRow = screen.getByTestId("submission-primary-row")
    expect(primaryRow).toContainElement(screen.getByLabelText("Bài viết được chọn"))
    expect(primaryRow).toContainElement(screen.getByLabelText("Ai có thể xem"))
    expect(screen.queryByTestId("submission-writer-intro")).not.toBeInTheDocument()
    expect(screen.queryByText("Giới thiệu người viết")).not.toBeInTheDocument()
    expect(screen.queryByText("Sẽ gửi")).not.toBeInTheDocument()
  })

  it("switches to an update action after the first submitted snapshot", () => {
    render(
      <EventRoomEditor
        eligiblePosts={[
          {
            id: "post-1",
            status: "DRAFT",
            title: "Draft pick",
            updatedAt: new Date("2026-06-17T00:00:00.000Z"),
            version: 3,
          },
        ]}
        event={{ finalPost: null, id: "event-1", status: "OPEN", title: "Awards" }}
        room={{
          id: "room-1",
          postId: "post-1",
          selectedPost: {
            id: "post-1",
            status: "DRAFT",
            title: "Draft pick",
            version: 3,
          },
          status: "SUBMITTED",
          submittedPostId: "post-1",
          submittedPostVersion: 3,
          visibility: "PRIVATE",
        }}
      />,
    )

    expect(screen.getByRole("button", { name: "Cập nhật bài tham gia" })).toBeVisible()
    expect(screen.queryByText("Có bản cập nhật")).not.toBeInTheDocument()
  })

  it("shows when the selected source post has a newer saved version", () => {
    render(
      <EventRoomEditor
        eligiblePosts={[
          {
            id: "post-1",
            status: "DRAFT",
            title: "Draft pick",
            updatedAt: new Date("2026-06-17T00:00:00.000Z"),
            version: 4,
          },
        ]}
        event={{ finalPost: null, id: "event-1", status: "OPEN", title: "Awards" }}
        room={{
          id: "room-1",
          postId: "post-1",
          selectedPost: {
            id: "post-1",
            status: "DRAFT",
            title: "Draft pick",
            version: 4,
          },
          status: "SUBMITTED",
          submittedPostId: "post-1",
          submittedPostVersion: 3,
          visibility: "PRIVATE",
        }}
      />,
    )

    expect(screen.getByText("Có bản cập nhật")).toBeVisible()
  })

  it("does not render the public event post shortcut inside the editor controls", () => {
    render(
      <EventRoomEditor
        eligiblePosts={[
          {
            id: "post-1",
            status: "DRAFT",
            title: "Draft pick",
            updatedAt: new Date("2026-06-17T00:00:00.000Z"),
            version: 1,
          },
        ]}
        event={{
          finalPost: { slug: "published-event", status: "PUBLISHED" },
          id: "event-1",
          status: "OPEN",
          title: "Awards",
        }}
        room={{
          id: "room-1",
          postId: "post-1",
          selectedPost: {
            id: "post-1",
            status: "DRAFT",
            title: "Draft pick",
            version: 1,
          },
          status: "SUBMITTED",
          submittedPostId: "post-1",
          submittedPostVersion: 1,
          visibility: "PRIVATE",
        }}
      />,
    )

    expect(screen.queryByRole("link", { name: "Mở bài viết công khai" }))
      .not.toBeInTheDocument()
  })
})
