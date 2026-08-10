import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("event entry published spacing contract", () => {
  it("keeps event entries on the editor prose rhythm", () => {
    const css = readFileSync("app/globals.css", "utf8")

    expect(css).toContain(".event-entry-post-content")
    expect(css).toContain(
      ".post-rich-text > figure:not(.float-left):not(.float-right)",
    )
    expect(css).toContain("margin: 0.5rem auto;")
    expect(css).not.toContain(
      '.event-entry-content .ProseMirror > p[data-empty="true"]',
    )
  })

  it("uses the canonical writer article geometry in every event view", () => {
    const anthology = readFileSync("components/events/EventAnthologyView.tsx", "utf8")
    const room = readFileSync(
      "app/(writer)/dashboard/events/[id]/rooms/[roomId]/page.tsx",
      "utf8",
    )
    const frame = readFileSync("components/posts/PostContentFrame.tsx", "utf8")
    const adminPreview = readFileSync(
      "app/(admin)/admin/events/[id]/preview/page.tsx",
      "utf8",
    )
    const adminPreviewShell = readFileSync(
      "components/events/AdminEventPreviewShell.tsx",
      "utf8",
    )
    const interactions = readFileSync(
      "components/posts/PostImageInteractions.tsx",
      "utf8",
    )

    expect(anthology).toContain("max-w-[1440px]")
    expect(anthology).toContain("lg:grid-cols-[minmax(0,1100px)]")
    expect(anthology).toContain("px-4 md:px-6")
    expect(anthology).not.toContain(
      'className="overflow-hidden rounded-[14px] border border-transparent"',
    )
    expect(room).toContain("lg:grid-cols-[minmax(0,1100px)]")
    expect(room).toContain("submittedContent: true")
    expect(room).toContain("room.submittedContent ?? room.selectedPost.content")
    expect(frame).toContain("px-3 py-4")
    expect(frame).toContain("sm:p-8 md:p-12")
    expect(frame).toContain("rounded-[14px] border border-transparent")
    expect(adminPreview).toContain("AdminEventPreviewShell")
    expect(adminPreviewShell).toContain("createPortal")
    expect(adminPreviewShell).toContain("fixed inset-0")
    expect(interactions).toContain('addEventListener("loadedmetadata"')
    expect(interactions).toContain('removeEventListener("loadedmetadata"')
  })
})
