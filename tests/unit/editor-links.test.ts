import { describe, expect, it } from "vitest"

import { getModifiedClickLink } from "@/components/editor/editorLinks"

describe("editor modified-click links", () => {
  it("returns a safe link for Ctrl+click and Cmd+click", () => {
    const link = document.createElement("a")
    link.href = "/article"
    const child = document.createElement("span")
    link.append(child)
    document.body.append(link)

    expect(
      getModifiedClickLink(
        new MouseEvent("click", { bubbles: true, button: 0, ctrlKey: true }),
      ),
    ).toBeNull()

    const ctrlClick = new MouseEvent("click", {
      bubbles: true,
      button: 0,
      ctrlKey: true,
    })
    child.dispatchEvent(ctrlClick)
    expect(getModifiedClickLink(ctrlClick)).toBe(link.href)

    const metaClick = new MouseEvent("click", {
      bubbles: true,
      button: 0,
      metaKey: true,
    })
    link.dispatchEvent(metaClick)
    expect(getModifiedClickLink(metaClick)).toBe(link.href)
  })

  it("ignores ordinary clicks and unsafe protocols", () => {
    const link = document.createElement("a")
    link.href = "javascript:alert(1)"
    document.body.append(link)

    const ordinaryClick = new MouseEvent("click", { bubbles: true, button: 0 })
    link.dispatchEvent(ordinaryClick)
    expect(getModifiedClickLink(ordinaryClick)).toBeNull()

    const ctrlClick = new MouseEvent("click", {
      bubbles: true,
      button: 0,
      ctrlKey: true,
    })
    link.dispatchEvent(ctrlClick)
    expect(getModifiedClickLink(ctrlClick)).toBeNull()
  })
})
