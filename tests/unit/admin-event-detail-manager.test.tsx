import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

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
  useRouter: () => ({ refresh: vi.fn() }),
}))

import { AdminEventDetailManager } from "@/components/events/AdminEventDetailManager"

describe("AdminEventDetailManager", () => {
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
})
