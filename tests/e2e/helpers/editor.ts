import { expect, type Locator } from "@playwright/test"

export async function placeCaretAtTextEnd(locator: Locator) {
  await locator.click()
  // Captions have nested node-view wrappers; select the actual text node.
  await locator.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let last: Node | null = null
    while (walker.nextNode()) last = walker.currentNode
    if (!last) throw new Error("Expected editable text")
    const range = document.createRange()
    range.setStart(last, last.textContent?.length ?? 0)
    range.collapse(true)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    document.dispatchEvent(new Event("selectionchange"))
  })
  await expect.poll(() => locator.evaluate((element) => {
    const selection = window.getSelection()
    return !!selection?.anchorNode && element.contains(selection.anchorNode)
      && selection.anchorOffset === selection.anchorNode.textContent?.length
  })).toBe(true)
}
