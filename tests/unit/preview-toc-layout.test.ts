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
  const tocIndex = source.lastIndexOf("<TableOfContents")
  const asideIndex = source.lastIndexOf('<aside className="', tocIndex)
  const classStart = asideIndex + '<aside className="'.length
  const classEnd = source.indexOf('"', classStart)

  return source.slice(classStart, classEnd)
}

const stickyClasses = [
  "sticky",
  "top-24",
  "self-start",
]

const stickyScrollClasses = [
  ...stickyClasses,
  "max-h-[calc(100vh-120px)]",
  "overflow-y-auto",
  "overscroll-auto",
  "no-scrollbar",
]

describe("preview table of contents layout", () => {
  it("keeps the saved-post preview TOC sticky and independently scrollable", () => {
    const classes = getTocAsideClasses(
      "app/(writer)/dashboard/preview/[id]/page.tsx",
    )

    expect(classes.split(" ")).toEqual(
      expect.arrayContaining(stickyClasses),
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

  it("hides the event writer-room TOC and widens content when there are no headings", () => {
    const source = read("app/(writer)/dashboard/events/[id]/rooms/[roomId]/page.tsx")

    expect(source).toContain("const hasTableOfContents = extractHeadings")
    expect(source).toContain("{hasTableOfContents && (")
    expect(source).toContain("lg:grid-cols-[minmax(0,1100px)]")
    expect(source).toContain("2xl:grid-cols-[minmax(0,1100px)_220px]")
    expect(source).not.toContain("max-w-[800px]")
  })

  it("omits the event-entry media block when the submission has no cover", () => {
    const source = read("app/(writer)/dashboard/events/[id]/rooms/[roomId]/page.tsx")

    expect(source).toContain(
      "{/* Post Image */}\n        {selectedPostCoverUrl && (\n          <div",
    )
  })

  it("shows the event-entry table of contents before the article on mobile", () => {
    const source = read("app/(writer)/dashboard/events/[id]/rooms/[roomId]/page.tsx")

    expect(source).toContain(
      '{hasTableOfContents && (\n          <div className="mx-auto w-full max-w-[1100px] px-4 md:px-6 2xl:hidden">',
    )
    expect(source).toContain("<TableOfContents collapsible")
  })

  it("shows the saved-post table of contents in a mobile card", () => {
    const source = read("components/posts/PostArticleView.tsx")

    expect(source).toContain(
      '{hasTableOfContents && (\n            <div className="2xl:hidden">',
    )
    expect(source).toContain("<TableOfContents collapsible")
  })
})
