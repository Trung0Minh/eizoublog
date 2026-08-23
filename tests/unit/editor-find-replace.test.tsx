import StarterKit from "@tiptap/starter-kit"
import { Editor } from "@tiptap/react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, describe, expect, it } from "vitest"

import { EditorFindReplace, findTextMatches } from "@/components/editor/EditorFindReplace"

function FindReplaceHarness({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  return <EditorFindReplace editor={editor} onOpenChange={setOpen} open={open} />
}

describe("EditorFindReplace", () => {
  let editor: Editor | null = null

  afterEach(() => {
    editor?.destroy()
    editor = null
  })

  it("finds case-insensitive matches with document positions", () => {
    editor = new Editor({
      content: "<p>Sakuga and sakuga.</p>",
      extensions: [StarterKit],
    })

    expect(findTextMatches(editor, "SAKUGA")).toEqual([
      { from: 1, to: 7 },
      { from: 12, to: 18 },
    ])
  })

  it("opens with Ctrl+F and replaces all matches", async () => {
    const user = userEvent.setup()
    editor = new Editor({
      content: "<p>cut one cut two CUT three</p>",
      extensions: [StarterKit],
    })

    render(<FindReplaceHarness editor={editor} />)

    fireEvent.keyDown(document, { ctrlKey: true, key: "f" })
    expect(screen.getByRole("search", { name: "Tìm và thay thế" })).toBeVisible()

    await user.type(screen.getByLabelText("Tìm trong bài viết"), "cut")
    await user.type(screen.getByLabelText("Thay bằng"), "trim")
    expect(screen.getByText("1 / 3")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Thay tất cả" }))
    expect(editor.getText()).toBe("trim one trim two trim three")
  })
})
