import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

describe("caption editing", () => {
  it("uses a multiline control for video captions and preserves caption line breaks", () => {
    const videoNodeView = readFileSync(
      join(process.cwd(), "components/editor/extensions/VideoNodeView.tsx"),
      "utf8",
    )
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")

    expect(videoNodeView).toContain("<textarea")
    expect(videoNodeView).toContain("rows={1}")
    expect(css).toContain("white-space: pre-line;")
  })
})
