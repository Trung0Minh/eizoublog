import type { JSONContent } from "@tiptap/react"

export function parseProfileBio(bio: string): JSONContent | null {
  if (!bio.startsWith("{")) return null

  try {
    const parsed: unknown = JSON.parse(bio)
    if (typeof parsed === "object" && parsed !== null && "type" in parsed) {
      return parsed as JSONContent
    }
  } catch {
    return null
  }

  return null
}

function getRichText(value: JSONContent): string {
  if (value.type === "text") return value.text ?? ""
  return value.content?.map(getRichText).join(" ") ?? ""
}

export function getProfileBioVisibleText(bio: string): string {
  const richBio = parseProfileBio(bio)
  return (richBio ? getRichText(richBio) : bio).replace(/\s+/g, " ").trim()
}
