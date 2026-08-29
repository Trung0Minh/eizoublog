const HEADING_ANCHOR_PX = 104

export function resolveActiveHeadingId(
  headingIds: string[],
  anchorY = HEADING_ANCHOR_PX,
) {
  const availableHeadings = headingIds.flatMap((id) => {
    const element = document.getElementById(id)
    return element ? [{ element, id }] : []
  })
  if (availableHeadings.length === 0) return ""

  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
  )
  const isAtDocumentEnd =
    documentHeight > window.innerHeight &&
    window.scrollY + window.innerHeight >= documentHeight - 2
  if (isAtDocumentEnd) return availableHeadings.at(-1)?.id ?? ""

  let activeId = availableHeadings[0].id
  for (const heading of availableHeadings) {
    if (heading.element.getBoundingClientRect().top > anchorY) break
    activeId = heading.id
  }
  return activeId
}
