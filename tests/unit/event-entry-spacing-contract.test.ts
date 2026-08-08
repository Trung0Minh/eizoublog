import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("event entry published spacing contract", () => {
  it("keeps event entries on the editor prose rhythm", () => {
    const css = readFileSync("app/globals.css", "utf8")

    expect(css).toContain(".event-entry-post-content")
    expect(css).toContain("font-size: 1rem;")
    expect(css).toContain("line-height: 1.65;")
    expect(css).toContain(
      '.post-content.event-entry-post-content .ProseMirror > figure[data-type="video-embed"]',
    )
    expect(css).toContain("margin: 0.5rem 0;")
    expect(css).not.toContain(
      '.event-entry-content .ProseMirror > p[data-empty="true"]',
    )
  })
})
