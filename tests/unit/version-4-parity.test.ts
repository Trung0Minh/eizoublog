import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8")
}

describe("anime-blog-4 appearance parity", () => {
  it("uses the parent design-token aliases in adapted public components", () => {
    const hero = read("components/posts/HeroCarousel.tsx")
    const about = read("app/(public)/about/AboutClient.tsx")

    expect(hero).toContain("text-text-primary")
    expect(hero).toContain("bg-subtle-bg")
    expect(hero).not.toMatch(/(?:^|\s)(?:text-primary|bg-subtle)(?=\s|["'])/)

    expect(about).toContain("bg-subtle-bg/80")
    expect(about).toContain("text-text-secondary")
    expect(about).not.toMatch(
      /(?:^|\s)(?:text-primary|text-secondary|bg-subtle)(?=\s|["'])/,
    )
  })

  it("mounts the version-4 typing particle layer in the real post editor", () => {
    const particlePath = join(root, "components/editor/EditorParticles.tsx")
    const editor = read("components/posts/PostEditor.tsx")

    expect(existsSync(particlePath)).toBe(true)
    expect(editor).toContain('import { EditorParticles } from "@/components/editor/EditorParticles"')
    expect(editor).toContain("<EditorParticles />")
  })

  it("provides adapted root error and missing-page states", () => {
    const errorPath = join(root, "app/error.tsx")
    const notFoundPath = join(root, "app/not-found.tsx")

    expect(existsSync(errorPath)).toBe(true)
    expect(existsSync(notFoundPath)).toBe(true)

    expect(read("app/error.tsx")).toContain("reset()")
    expect(read("app/not-found.tsx")).toContain('href="/"')
  })

  it("keeps About body edits when other editable fields change", () => {
    const about = read("app/(public)/about/AboutClient.tsx")

    expect(about).toContain("setData((currentData) => ({")
    expect(about).toContain("body: json")
    expect(about).not.toContain("setData({ ...data, body: json })")
  })
})
