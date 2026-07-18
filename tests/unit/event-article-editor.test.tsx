import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("@/components/editor/TiptapEditor", () => ({
  TiptapEditor: ({
    onChange,
  }: {
    onChange: (
      content: { content: Array<{ type: string }>; type: string },
      text: string,
    ) => void
  }) => (
    <button
      onClick={() =>
        onChange(
          { content: [{ type: "paragraph" }], type: "doc" },
          "Edited merged article",
        )
      }
      type="button"
    >
      Change article
    </button>
  ),
}))

import { EventArticleEditor } from "@/components/events/EventArticleEditor"

describe("EventArticleEditor", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("saves manual edits to the final post without touching source submissions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { version: 8 } }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(
      <EventArticleEditor
        event={{
          finalPost: {
            content: { content: [], type: "doc" },
            contentText: "Original merged article",
            id: "final-post-1",
            slug: "event-archive-2025",
            version: 7,
          },
          id: "event-1",
          rooms: [
            {
              id: "room-1",
              order: 0,
              selectedPost: { title: "Contributor source" },
              writer: { name: "Writer One", username: "writer-one" },
            },
          ],
          status: "PUBLISHED",
          title: "Event Archive 2025",
        }}
      />,
    )

    expect(screen.getByText("Editorial boundary")).toBeInTheDocument()
    expect(
      screen.getByText(/Contributor source posts stay unchanged/),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Change article" }))
    fireEvent.click(
      screen.getByRole("button", { name: "Save merged article" }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/posts/final-post-1", {
        body: JSON.stringify({
          baseVersion: 7,
          content: { content: [{ type: "paragraph" }], type: "doc" },
          contentText: "Edited merged article",
          saveKind: "MANUAL",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
    })
    expect(await screen.findByText("All changes saved")).toBeInTheDocument()
  })
})
