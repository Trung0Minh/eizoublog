import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  getNotifications: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
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
  redirect: mocks.redirect,
  useRouter: () => mocks.router,
}))
vi.mock("@/lib/authz", () => ({ getActiveSession: mocks.getActiveSession }))
vi.mock("@/lib/notifications", () => ({
  getNotifications: mocks.getNotifications,
}))
vi.mock("@/components/notifications/MarkCommentsReadButton", () => ({
  MarkCommentsReadButton: ({ disabled }: { disabled?: boolean }) => (
    <button disabled={disabled} type="button">
      Đánh dấu tất cả đã đọc
    </button>
  ),
}))
vi.mock("@/components/posts/CoAuthorInviteActions", () => ({
  CoAuthorInviteActions: () => <div>Invite actions</div>,
}))

import { ViewLink } from "@/components/notifications/ViewLink"
import NotificationsPage from "@/app/(writer)/dashboard/notifications/page"

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: {
        email: "writer@example.com",
        id: "writer-1",
        role: "WRITER",
      },
    })
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [],
      responseEvents: [],
      unreadComments: [],
    })
  })

  it("links co-author response notifications to the editor instead of the public post", async () => {
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [],
      responseEvents: [
        {
          createdAt: new Date("2026-06-16T05:00:00Z"),
          data: {
            actorName: "Anh Đức",
            postId: "post-1",
            postSlug: "draft-only-post",
            postTitle: "Draft only post",
          },
          id: "notification-1",
          type: "COAUTHOR_ACCEPTED",
        },
      ],
      unreadComments: [],
    })

    render(await NotificationsPage({ searchParams: Promise.resolve({}) }))

    const responseLink = screen.getByRole("link", { name: "Draft only post" })
    const viewLink = screen.getByRole("link", { name: "Xem" })

    expect(responseLink).toHaveAttribute("href", "/dashboard/edit/post-1")
    expect(viewLink).toHaveAttribute("href", "/dashboard/edit/post-1")
    expect(
      screen.getByRole("button", { name: "Đánh dấu đã đọc" }),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }))
      .toBeEnabled()
    expect(screen.getByRole("link", { name: "Tất cả" })).toBeVisible()
    expect(screen.getByRole("link", { name: "Kiểm duyệt" })).toBeVisible()
    expect(screen.getByTestId("notification-notification-1")).toHaveClass(
      "grid-cols-[auto_minmax(0,1fr)]",
    )
    expect(screen.queryByRole("heading", { name: "Phản hồi lời mời" })).not.toBeInTheDocument()
  })

  it("shows moderation reasons in the unified tagged feed", async () => {
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [],
      responseEvents: [
        {
          createdAt: new Date("2026-07-13T05:00:00Z"),
          data: {
            action: "UNPUBLISH",
            actorName: "Admin",
            fromStatus: "PUBLISHED",
            postId: "post-1",
            postTitle: "Essay",
            reason: "Please add reliable sources.",
            toStatus: "DRAFT",
          },
          id: "notification-1",
          type: "POST_MODERATION",
        },
      ],
      unreadComments: [],
    })

    render(await NotificationsPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getAllByText("Kiểm duyệt")).toHaveLength(2)
    expect(screen.getByText("Bài viết đã bị rút khỏi xuất bản")).toBeVisible()
    expect(screen.getByText("Please add reliable sources.")).toBeVisible()
    expect(screen.getByRole("link", { name: "Chỉnh sửa bài viết" })).toHaveAttribute(
      "href",
      "/dashboard/edit/post-1",
    )
    expect(
      screen.getByRole("button", { name: "Đánh dấu đã đọc" }),
    ).toBeVisible()
  })

  it("disables the global read button when only pending invites remain", async () => {
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [
        {
          post: {
            author: { name: "Mina", username: "mina" },
            id: "post-2",
            slug: "shared-draft",
            title: "Shared Draft",
            updatedAt: new Date("2026-06-16T03:00:00Z"),
          },
          postId: "post-2",
        },
      ],
      responseEvents: [],
      unreadComments: [],
    })

    render(await NotificationsPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }))
      .toBeDisabled()
  })

  it("shows event submission feedback in the comments feed", async () => {
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [],
      responseEvents: [],
      unreadComments: [
        {
          author: { name: "Admin", username: "admin" },
          content: "Please tighten the third paragraph.",
          createdAt: new Date("2026-07-22T04:00:00Z"),
          event: { id: "event-1", title: "Awards" },
          id: "event-comment-1",
          isRead: false,
          room: { id: "room-1", title: "My submission" },
        },
      ],
    })

    render(
      await NotificationsPage({
        searchParams: Promise.resolve({ type: "comments" }),
      }),
    )

    expect(screen.getByText("Admin đã gửi feedback trong “My submission”")).toBeVisible()
    expect(screen.getByText("Awards")).toBeVisible()
    expect(screen.getByText("Please tighten the third paragraph.")).toBeVisible()
    expect(screen.getByRole("link", { name: "Xem" })).toHaveAttribute(
      "href",
      "/dashboard/events/event-1/rooms/room-1",
    )
    expect(
      screen.getByRole("button", { name: "Đánh dấu đã đọc" }),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }))
      .toBeEnabled()
  })

  it("keeps read comments in all notifications but hides them from unread", async () => {
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [],
      responseEvents: [],
      unreadComments: [
        {
          authorName: "Reader",
          content: "Already handled.",
          createdAt: new Date("2026-07-22T04:00:00Z"),
          id: "comment-1",
          isRead: true,
          post: { slug: "essay", title: "Essay" },
        },
      ],
    })

    render(await NotificationsPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText("Reader đã bình luận trong “Essay”")).toBeVisible()
    expect(screen.getByRole("button", { name: "Đánh dấu chưa đọc" })).toBeVisible()

    cleanup()
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [],
      responseEvents: [],
      unreadComments: [
        {
          authorName: "Reader",
          content: "Already handled.",
          createdAt: new Date("2026-07-22T04:00:00Z"),
          id: "comment-1",
          isRead: true,
          post: { slug: "essay", title: "Essay" },
        },
      ],
    })

    render(
      await NotificationsPage({
        searchParams: Promise.resolve({ type: "unread" }),
      }),
    )

    expect(screen.getByText("Không có thông báo trong mục này.")).toBeVisible()
  })

  describe("ViewLink component", () => {
    it("calls the mark-read API, dispatches event, and navigates on click for commentId", async () => {
      let resolveRequest: ((response: Response) => void) | undefined
      const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(
        () => new Promise<Response>((resolve) => {
          resolveRequest = resolve
        }),
      )

      const dispatchSpy = vi.spyOn(window, "dispatchEvent")

      render(
        <ViewLink commentId="comment-1" href="/test-path">
          Test Comment Link
        </ViewLink>,
      )

      const link = screen.getByRole("link", { name: "Test Comment Link" })
      fireEvent.click(link)

      expect(fetchSpy).toHaveBeenCalledWith("/api/user/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId: "comment-1" }),
        keepalive: true,
      })

      expect(mocks.router.push).toHaveBeenCalledWith("/test-path")
      expect(dispatchSpy.mock.calls.some(
        (call) => call[0].type === "notifications:changed",
      )).toBe(false)

      resolveRequest?.(new Response(JSON.stringify({ data: { success: true } })))

      await waitFor(() => expect(dispatchSpy.mock.calls.some(
        (call) => call[0].type === "notifications:changed",
      )).toBe(true))

      fetchSpy.mockRestore()
      dispatchSpy.mockRestore()
    })

    it("calls the mark-read API, dispatches event, and navigates on click for notificationId", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ data: { success: true } }),
      } as Response)

      const dispatchSpy = vi.spyOn(window, "dispatchEvent")

      render(
        <ViewLink notificationId="notification-1" href="/another-path">
          Test Notification Link
        </ViewLink>,
      )

      const link = screen.getByRole("link", { name: "Test Notification Link" })
      fireEvent.click(link)

      expect(fetchSpy).toHaveBeenCalledWith("/api/user/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: "notification-1" }),
        keepalive: true,
      })

      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event))
        const event = dispatchSpy.mock.calls.find(
          (call) => call[0].type === "notifications:changed",
        )?.[0]
        expect(event).toBeDefined()
        expect(mocks.router.push).toHaveBeenCalledWith("/another-path")
      })

      fetchSpy.mockRestore()
      dispatchSpy.mockRestore()
    })

    it("calls the mark-read API for eventRoomCommentId", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ data: { success: true } }),
      } as Response)

      render(
        <ViewLink eventRoomCommentId="event-comment-1" href="/dashboard/events/event-1/rooms/room-1">
          Test Event Feedback Link
        </ViewLink>,
      )

      fireEvent.click(screen.getByRole("link", { name: "Test Event Feedback Link" }))

      expect(fetchSpy).toHaveBeenCalledWith("/api/user/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventRoomCommentId: "event-comment-1" }),
        keepalive: true,
      })

      await waitFor(() => {
        expect(mocks.router.push).toHaveBeenCalledWith(
          "/dashboard/events/event-1/rooms/room-1",
        )
      })

      fetchSpy.mockRestore()
    })
  })
})
