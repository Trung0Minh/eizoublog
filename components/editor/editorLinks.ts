const UNSAFE_LINK_PROTOCOL = /^(?:javascript|data|vbscript):/i

export function getModifiedClickLink(event: MouseEvent) {
  if ((!event.ctrlKey && !event.metaKey) || event.button !== 0) {
    return null
  }

  const target = event.target
  if (!(target instanceof Element)) {
    return null
  }

  const link = target.closest<HTMLAnchorElement>("a[href]")
  if (!link) {
    return null
  }

  const href = link.getAttribute("href")?.trim()

  if (!href || UNSAFE_LINK_PROTOCOL.test(href)) {
    return null
  }

  return link.href
}
