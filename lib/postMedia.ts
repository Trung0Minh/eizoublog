export function getPostMediaUrls(post: { content: unknown; coverUrl: string | null }) {
  const urls = new Set<string>()

  function collect(value: unknown) {
    if (typeof value === "string") {
      if (/^https?:\/\//i.test(value)) urls.add(value)
      return
    }

    if (Array.isArray(value)) {
      value.forEach(collect)
      return
    }

    if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(collect)
    }
  }

  if (post.coverUrl) urls.add(post.coverUrl)
  collect(post.content)
  return urls
}
