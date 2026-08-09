import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("post editor layout contracts", () => {
  it("places settings on the right and keeps save status above the mobile dock", () => {
    const editor = read("components/posts/PostEditor.tsx")

    expect(editor).toContain("fixed inset-y-0 right-0")
    expect(editor).not.toContain("lg:mr-[320px] xl:mr-[360px]")
    expect(editor).toContain("max-w-[1100px]")
    expect(editor).toContain("fixed bottom-[72px] left-1/2")
    expect(editor).toContain("lg:bottom-6 lg:left-6")
    expect(editor).not.toContain("fixed bottom-6 right-6")
    expect(editor).toContain("overflow-y-auto lg:ml-20")
    expect(editor).not.toContain("min-w-[320px] xl:min-w-[360px]")
  })

  it("keeps the editable post title in the main writing surface", () => {
    const editor = read("components/posts/PostEditor.tsx")
    const panelIndex = editor.indexOf('id="post-settings-panel"')
    const titleIndex = editor.indexOf('id="post-title"')
    const writingSurfaceIndex = editor.indexOf('data-testid="editor-writing-surface"')

    expect(panelIndex).toBeGreaterThan(-1)
    expect(writingSurfaceIndex).toBeGreaterThan(panelIndex)
    expect(titleIndex).toBeGreaterThan(writingSurfaceIndex)
  })

  it("keeps the editor column wide enough for the shared toolbar", () => {
    const editor = read("components/posts/PostEditor.tsx")

    expect(editor).toContain("max-w-[1100px]")
    expect(editor).not.toContain("max-w-[1200px]")
  })

  it("groups blockquote with inline and block code controls", () => {
    const toolbar = read("components/editor/EditorToolbar.tsx")
    const spoilerIndex = toolbar.lastIndexOf('title="Spoiler block"')
    const blockquoteIndex = toolbar.lastIndexOf('title="Blockquote"')
    const inlineCodeIndex = toolbar.lastIndexOf('title="Inline code"')
    const codeBlockIndex = toolbar.lastIndexOf('title="Code block"')

    expect(blockquoteIndex).toBeGreaterThan(spoilerIndex)
    expect(inlineCodeIndex).toBeGreaterThan(blockquoteIndex)
    expect(codeBlockIndex).toBeGreaterThan(inlineCodeIndex)
  })
})
