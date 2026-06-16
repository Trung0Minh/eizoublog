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
vi.mock("@/components/editor/TiptapEditor", () => ({
  TiptapEditor: () => <div data-testid="event-editor" />,
}))

import { EventRoomEditor } from "@/components/events/EventRoomEditor"

const content = {
  content: [{ type: "paragraph" }],
  type: "doc",
}

describe("EventRoomEditor", () => {
  it("renders a writer room without requiring browser-only editor setup", () => {
    render(
      <EventRoomEditor
        event={{
          finalPost: null,
          id: "event-1",
          status: "OPEN",
          title: "Awards",
        }}
        room={{
          content,
          contentText: "",
          id: "room-1",
          status: "DRAFT",
          visibility: "PRIVATE",
          writerIntro: null,
        }}
        sharedRooms={[]}
      />,
    )

    expect(screen.getByTestId("event-editor")).toBeVisible()
    expect(screen.getByRole("button", { name: /Save/i })).toBeVisible()
    expect(screen.getByRole("button", { name: /Submit/i })).toBeVisible()
  })
})
