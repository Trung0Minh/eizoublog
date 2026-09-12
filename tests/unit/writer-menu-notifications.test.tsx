import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}))

vi.mock("next-auth/react", () => ({
  signOut: mocks.signOut,
}))
vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))

import { WriterMenu } from "@/components/layout/WriterMenu"
import { requestNotificationRefresh } from "@/lib/clientNotifications"

describe("WriterMenu notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("coalesces a refresh burst and fetches fresh counts after an in-flight invalidation", async () => {
    const pending: Array<(response: Response) => void> = []
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(resolve => pending.push(resolve)))
    const response = (unreadComments: number) => new Response(JSON.stringify({
      data: { counts: { pendingInvites: 0, responseEvents: 0, openEvents: 0, unreadComments } },
    }))
    try {
      render(<WriterMenu user={{ name: "Mina", username: "mina", role: "WRITER", avatarUrl: null }} />)
      act(() => {
        window.dispatchEvent(new Event("focus"))
        window.dispatchEvent(new Event("online"))
        requestNotificationRefresh()
        requestNotificationRefresh()
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      await act(async () => { pending[0](response(8)) })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      const trigger = screen.getByRole("button", { name: "Mở menu tác giả" })
      expect(trigger.querySelector(".bg-red-500")).toBeNull()
      await act(async () => { pending[1](response(1)) })
      expect(trigger.querySelector(".bg-red-500")).not.toBeNull()
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally { fetchMock.mockRestore() }
  })

  it("does not let an old user's pending refresh affect a new user or survive unmount", async () => {
    const pending: Array<(response: Response) => void> = []
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(resolve => pending.push(resolve)))
    try {
      const { rerender, unmount } = render(<WriterMenu user={{ name: "Mina", username: "mina", role: "WRITER", avatarUrl: null }} />)
      act(() => requestNotificationRefresh())
      rerender(<WriterMenu user={{ name: "Ken", username: "ken", role: "WRITER", avatarUrl: null }} />)
      expect(fetchMock).toHaveBeenCalledTimes(2)
      await act(async () => { pending[0](new Response(JSON.stringify({ data: { count: 8 } }))) })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(screen.getByRole("button", { name: "Mở menu tác giả" }).querySelector(".bg-red-500")).toBeNull()
      act(() => requestNotificationRefresh())
      unmount()
      await act(async () => { pending[1](new Response(JSON.stringify({ data: { count: 1 } }))) })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally { fetchMock.mockRestore() }
  })

  it("keeps displaying completed polls when responses take longer than the polling interval", async () => {
    vi.useFakeTimers()
    const pending: Array<(response: Response) => void> = []
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(resolve => pending.push(resolve)))
    try {
      render(<WriterMenu user={{ name: "Mina", username: "mina", role: "WRITER", avatarUrl: null }} />)
      await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      await act(async () => { pending[0](new Response(JSON.stringify({ data: { count: 1 } }))) })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(screen.getByRole("button", { name: "Mở menu tác giả" }).querySelector(".bg-red-500")).not.toBeNull()
      await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally { fetchMock.mockRestore() }
  })

  it("fetches lightweight notification counts even when a user is provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input)
        if (url === "/api/user/notification-counts") {
          return new Response(
            JSON.stringify({
              data: {
                counts: {
                  pendingInvites: 2,
                  responseEvents: 1,
                  total: 6,
                  unreadComments: 3,
                },
                pendingInvites: [],
                responseEvents: [],
                unreadComments: [],
              },
            }),
          )
        }
        return new Response(JSON.stringify({ data: { count: 0 } }))
      })

    try {
      render(
        <WriterMenu
          user={{
            avatarUrl: null,
            name: "Mina Writer",
            role: "WRITER",
            username: "mina",
          }}
        />,
      )

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/user/notification-counts", {
          cache: "no-store",
        })
      })
      expect(fetchMock).not.toHaveBeenCalledWith("/api/user/notifications")

      await userEvent.click(
        screen.getByRole("button", { name: "Mở menu tác giả" }),
      )

      expect(screen.getByRole("menuitem", { name: /Thông báo/ })).toHaveAttribute(
        "href",
        "/dashboard/notifications",
      )
      expect(screen.getByText("6")).toBeInTheDocument()
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("refreshes notification counts while the visible page remains open", async () => {
    vi.useFakeTimers()
    let unreadComments = 0
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        new Response(JSON.stringify({
          data: {
            counts: {
              openEvents: 0,
              pendingInvites: 0,
              responseEvents: 0,
              total: unreadComments,
              unreadComments,
            },
          },
        })),
      )

    try {
      render(
        <WriterMenu
          user={{
            avatarUrl: null,
            name: "Mina Writer",
            role: "WRITER",
            username: "mina",
          }}
        />,
      )

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
      unreadComments = 1
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000)
      })
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

      await vi.waitFor(() => expect(
        screen.getByRole("button", { name: "Mở menu tác giả" }).querySelector(".bg-red-500"),
      ).not.toBeNull())
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("shows open event badges separately and clears them when the writer checks events", async () => {
    const user = userEvent.setup()
    let openEvents = 2
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) => {
        const url = String(input)
        if (url === "/api/user/notification-counts") {
          return new Response(
            JSON.stringify({
              data: {
                counts: {
                  openEvents,
                  pendingInvites: 0,
                  responseEvents: 1,
                  total: 3,
                  unreadComments: 0,
                },
              },
            }),
          )
        }
        if (
          url === "/api/user/event-notifications/seen" &&
          init?.method === "POST"
        ) {
          openEvents = 0
          return new Response(JSON.stringify({ data: { count: 0 } }))
        }
        return new Response(JSON.stringify({ data: { count: 0 } }))
      })

    try {
      render(
        <WriterMenu
          user={{
            avatarUrl: null,
            name: "Mina Writer",
            role: "WRITER",
            username: "mina",
          }}
        />,
      )

      const menuTrigger = screen.getByRole("button", { name: "Mở menu tác giả" })
      await user.click(menuTrigger)

      expect(screen.getByRole("menuitem", { name: /Sự kiện viết/ })).toHaveTextContent(
        "2",
      )
      expect(screen.getByRole("menuitem", { name: /Thông báo/ })).toHaveTextContent(
        "1",
      )

      await user.click(screen.getByRole("menuitem", { name: /Sự kiện viết/ }))

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user/event-notifications/seen",
        { method: "POST" },
      )
      await user.click(menuTrigger)
      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: /Sự kiện viết/ }),
        ).not.toHaveTextContent("2")
      })
    } finally {
      fetchMock.mockRestore()
    }
  })
})
