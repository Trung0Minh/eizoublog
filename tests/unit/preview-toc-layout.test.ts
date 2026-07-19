import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

function getTocAsideClasses(relativePath: string) {
  const source = relativePath.includes("dashboard/preview")
    ? read("components/posts/PostArticleView.tsx")
    : read(relativePath)
  const tocIndex = source.indexOf("<TableOfContents")
  const asideIndex = source.lastIndexOf('<aside className="', tocIndex)
  const classStart = asideIndex + '<aside className="'.length
  const classEnd = source.indexOf('"', classStart)

  return source.slice(classStart, classEnd)
}

const stickyScrollClasses = [
  "sticky",
  "top-24",
  "self-start",
  "max-h-[calc(100vh-120px)]",
  "overflow-y-auto",
  "overscroll-contain",
  "no-scrollbar",
]

describe("preview table of contents layout", () => {
  it("keeps the saved-post preview TOC sticky and independently scrollable", () => {
    const classes = getTocAsideClasses(
      "app/(writer)/dashboard/preview/[id]/page.tsx",
    )

    expect(classes.split(" ")).toEqual(
      expect.arrayContaining(stickyScrollClasses),
    )
  })

  it("keeps the event writer-room TOC sticky and independently scrollable", () => {
    const classes = getTocAsideClasses(
      "app/(writer)/dashboard/events/[id]/rooms/[roomId]/page.tsx",
    )

    expect(classes.split(" ")).toEqual(
      expect.arrayContaining(stickyScrollClasses),
    )
  })
})
