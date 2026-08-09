import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("article rich-text presentation contract", () => {
  it("applies one shared presentation class to editor and static article roots", () => {
    const editor = read("components/editor/TiptapEditor.tsx")
    const staticContent = read("components/posts/StaticPostContent.tsx")

    expect(editor).toContain("post-rich-text")
    expect(staticContent).toContain('className="ProseMirror post-rich-text"')
  })

  it("uses editor typography and rhythm for published article content", () => {
    const css = read("app/globals.css")

    expect(css).toMatch(/\.post-rich-text\s*\{[^}]*font-size:\s*1rem;/)
    expect(css).toMatch(/\.post-rich-text\s*\{[^}]*line-height:\s*1\.65;/)
    expect(css).toMatch(
      /\.post-rich-text[^{}]*> figure:not\(\.float-left\):not\(\.float-right\)\s*\{[^}]*margin:\s*0\.5rem auto;/,
    )
    expect(css).not.toMatch(
      /\.post-content \.ProseMirror > figure:not\(\.float-left\):not\(\.float-right\)\s*\{[^}]*margin:\s*2em auto;/,
    )
  })
})
