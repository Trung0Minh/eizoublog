export interface SearchResult {
  authorAvatarUrl: string | null
  authorName: string
  authorUsername: string
  coverUrl: string | null
  excerpt: string | null
  id: string
  publishedAt: Date | string
  rank: number
  slug: string
  snippet: string | null
  title: string
}

export interface PreparedSearchQuery {
  canUseFuzzy: boolean
  displayQuery: string
  normalizedQuery: string
  prefixTsQuery: string
}

export interface SearchFilters {
  archive?: string
  categorySlug?: string
  tagSlugs: string[]
}

export interface HighlightedSearchSegment {
  highlight: boolean
  text: string
}

const MAX_PREFIX_TOKENS = 8

export function normalizeSearchText(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[Đđ]/g, "d")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function prepareSearchQuery(raw: string): PreparedSearchQuery {
  const displayQuery = raw.trim()
  const normalizedQuery = normalizeSearchText(displayQuery)
  const tokens = normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, MAX_PREFIX_TOKENS)
    .filter(Boolean)

  const prefixTsQuery = tokens.map((token) => `${token}:*`).join(" & ")

  return {
    canUseFuzzy: normalizedQuery.length >= 3,
    displayQuery,
    normalizedQuery,
    prefixTsQuery,
  }
}

export function sanitizeSearchSnippet(snippet: string | null): string {
  if (!snippet) {
    return ""
  }

  return snippet
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/&#39;/g, "'")
    .replace(/&lt;mark&gt;/g, "<mark>")
    .replace(/&lt;\/mark&gt;/g, "</mark>")
}

function normalizeSearchCharacter(character: string): string {
  return character
    .normalize("NFKC")
    .replace(/[Đđ]/g, "d")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]+/gu, " ")
}

function buildNormalizedTextMap(text: string) {
  let normalizedText = ""
  const originalIndexes: number[] = []

  for (let index = 0; index < text.length; index += 1) {
    const normalizedCharacter = normalizeSearchCharacter(text[index] ?? "")

    for (const character of normalizedCharacter) {
      normalizedText += character
      originalIndexes.push(index)
    }
  }

  return { normalizedText, originalIndexes }
}

export function getHighlightedSearchSegments(
  text: string,
  query: string,
): HighlightedSearchSegment[] {
  const trimmedText = text.trim()
  if (!trimmedText) return []

  const tokens = Array.from(new Set(normalizeSearchText(query).split(/\s+/)))
    .filter((token) => token.length >= 2)
    .sort((first, second) => second.length - first.length)

  if (tokens.length === 0) {
    return [{ highlight: false, text: trimmedText }]
  }

  const { normalizedText, originalIndexes } = buildNormalizedTextMap(trimmedText)
  const ranges: Array<{ end: number; start: number }> = []

  for (const token of tokens) {
    let searchFrom = 0
    let matchIndex = normalizedText.indexOf(token, searchFrom)

    while (matchIndex !== -1) {
      const start = originalIndexes[matchIndex]
      const lastNormalizedIndex = matchIndex + token.length - 1
      const end = (originalIndexes[lastNormalizedIndex] ?? start) + 1

      if (
        start !== undefined &&
        !ranges.some((range) => start < range.end && end > range.start)
      ) {
        ranges.push({ end, start })
      }

      searchFrom = matchIndex + token.length
      matchIndex = normalizedText.indexOf(token, searchFrom)
    }
  }

  if (ranges.length === 0) {
    return [{ highlight: false, text: trimmedText }]
  }

  ranges.sort((first, second) => first.start - second.start)

  const segments: HighlightedSearchSegment[] = []
  let cursor = 0

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({
        highlight: false,
        text: trimmedText.slice(cursor, range.start),
      })
    }

    segments.push({
      highlight: true,
      text: trimmedText.slice(range.start, range.end),
    })
    cursor = range.end
  }

  if (cursor < trimmedText.length) {
    segments.push({ highlight: false, text: trimmedText.slice(cursor) })
  }

  return segments
}
