export const MAX_POST_EXCERPT_CHARACTERS = 500

export function truncatePostExcerpt(value: string | null | undefined) {
  if (value === null || value === undefined) return value

  const trimmed = value.trim()
  if (trimmed.length <= MAX_POST_EXCERPT_CHARACTERS) return trimmed

  return `${trimmed.slice(0, MAX_POST_EXCERPT_CHARACTERS - 1).trimEnd()}…`
}
