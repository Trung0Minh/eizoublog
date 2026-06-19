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
    const editor = read("components/editor/TiptapEditor.tsx")
    const sitePageApiPath = join(root, "app/api/admin/site-pages/[slug]/route.ts")

    expect(existsSync(sitePageApiPath)).toBe(true)
    expect(editor).toContain("onEditorReady")
    expect(about).toContain("aboutEditorRef")
    expect(about).toContain("aboutEditorRef.current?.getJSON()")
    expect(about).toContain("dataRef.current")
    expect(about).toContain("contentTextRef.current")
    expect(about).toContain('fetch("/api/admin/site-pages/about"')
    expect(about).toContain("updateData((currentData) => ({")
    expect(about).toContain("body: json")
    expect(about).not.toContain("setData({ ...data, body: json })")
  })

  it("keeps the Resources edit button hover scope and save draft current", () => {
    const resources = read("app/(public)/resources/ResourcesClient.tsx")

    expect(resources).toContain('className="relative group"')
    expect(resources).toContain("dataRef.current")
    expect(resources).toContain('fetch("/api/admin/site-pages/resources"')
    expect(resources).toContain("group/resource")
    expect(resources).toContain("group-hover/resource")
    expect(resources).not.toContain("opacity-0 transition-opacity group-hover:opacity-100")
  })

  it("aligns home sort tabs with the post column", () => {
    const homePostList = read("app/(public)/HomePostList.tsx")

    expect(homePostList).toContain("mb-6 flex justify-start")
    expect(homePostList).not.toContain("mb-6 flex justify-end")
  })

  it("shows fallback tags on post pages when a post has no tags", () => {
    const postPage = read("app/(public)/[slug]/page.tsx")

    expect(postPage).toContain("fallbackTags")
    expect(postPage).toContain("post.tags.length > 0")
    expect(postPage).toContain("Animation Analysis")
  })

  it("keeps post title and excerpt outside the Tiptap body editor", () => {
    const editor = read("components/posts/PostEditor.tsx")
    const titleIndex = editor.indexOf('id="post-title"')
    const tiptapIndex = editor.indexOf("<TiptapEditor")

    expect(titleIndex).toBeGreaterThan(-1)
    expect(tiptapIndex).toBeGreaterThan(-1)
    expect(titleIndex).toBeLessThan(tiptapIndex)
    expect(editor).not.toContain("</TiptapEditor>")
  })
})
