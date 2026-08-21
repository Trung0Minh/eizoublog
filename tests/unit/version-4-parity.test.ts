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
    const intro = read("app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx")

    expect(hero).toContain("glass-card")
    expect(hero).toContain("text-accent")
    expect(hero).toContain("bg-accent")
    expect(hero).not.toMatch(/(?:^|\s)(?:text-primary|bg-subtle)(?=\s|["'])/)

    expect(about).toContain("bg-background/90")
    expect(intro).toContain("bg-background/90")
    expect(about).toContain("text-text-secondary")
    expect(about).not.toMatch(
      /(?:^|\s)(?:text-primary|text-secondary|bg-subtle)(?=\s|["'])/,
    )
  })

  it("does not clamp featured story excerpts", () => {
    const hero = read("components/posts/HeroCarousel.tsx")

    expect(hero).not.toContain("line-clamp-2 md:line-clamp-3")
  })

  it("hides featured story subtitles below the desktop breakpoint", () => {
    const hero = read("components/posts/HeroCarousel.tsx")
    expect(hero).toContain('className="mt-3 hidden max-w-4xl')
    expect(hero).toContain("md:block")
  })

  it("loads featured covers from the original asset URL", () => {
    const hero = read("components/posts/HeroCarousel.tsx")
    expect(hero).toContain("post.coverUrl?.split('?')[0]")
  })

  it("avoids mounting duplicate particle layers inside the post editor", () => {
    const editor = read("components/posts/PostEditor.tsx")

    expect(editor).not.toContain('import { EditorParticles } from "@/components/editor/EditorParticles"')
    expect(editor).not.toContain("<EditorParticles />")
    expect(editor).not.toContain("<SeasonalEffects />")
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

  it("uses compact rich text for the About page reason field", () => {
    const about = read("app/(public)/about/AboutClient.tsx")

    expect(about).toContain('mode="compact"')
    expect(about).toContain("whyWeDoThisEditorRef")
    expect(about).not.toContain("<Textarea")
  })

  it("uses the available mobile width for the About panel and Resources title", () => {
    const about = read("app/(public)/about/AboutClient.tsx")
    const resources = read("app/(public)/resources/ResourcesClient.tsx")

    expect(about).toContain("w-full max-w-full")
    expect(about).toContain("md:w-fit")
    expect(resources).toContain("flex-nowrap whitespace-nowrap")
    expect(resources).toContain("[&>span:last-child]:mr-0")
  })

  it("keeps the Resources edit button hover scope and save draft current", () => {
    const resources = read("app/(public)/resources/ResourcesClient.tsx")

    expect(resources).toContain('className="relative group min-h-screen')
    expect(resources).toContain('fetch("/api/admin/site-pages/resources"')
    expect(resources).toContain("group/resource")
    expect(resources).toContain("group-hover/resource")
    expect(resources).toContain("isEditing")
  })

  it("keeps resource card reveals quick while preserving their entrance motion", () => {
    const resources = read("app/(public)/resources/ResourcesClient.tsx")

    expect(resources).toContain("delay: Math.min(index * 0.04, 0.12)")
    expect(resources).toContain("duration: 0.35")
  })

  it("aligns home sort tabs with the post column", () => {
    const homePostList = read("app/(public)/HomePostList.tsx")

    expect(homePostList).toContain("mb-6 flex justify-start")
    expect(homePostList).not.toContain("mb-6 flex justify-end")
  })

  it("uses one shared horizontal inset for the homepage hero and content grid", () => {
    const hero = read("components/posts/HeroCarousel.tsx")

    expect(hero).not.toContain("mt-4 px-4 md:px-5")
  })

  it("does not invent fallback tags on post pages", () => {
    const postPage = read("app/(public)/[slug]/page.tsx")
    const postHero = read("components/posts/PostHero.tsx")

    expect(postPage).not.toContain("fallbackTags")
    expect(postPage).not.toContain("post.tags.length > 0")
    expect(postHero).toContain("post.tags.map(({ tag }) => (")
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

  it("keeps route transitions from containing fixed overlays", () => {
    const templates = [read("app/template.tsx"), read("app/(public)/template.tsx")]

    templates.forEach((template) => {
      expect(template).toContain("opacity")
      expect(template).not.toContain("filter:")
      expect(template).not.toContain("fixed")
    })
  })

  it("routes global decoration through a tool-aware effects boundary", () => {
    const layout = read("app/layout.tsx")

    expect(layout).toContain('import { GlobalEffects } from "@/components/ui/GlobalEffects"')
    expect(layout).toContain("<GlobalEffects />")
    expect(layout).not.toContain("<AmbientBackground />")
    expect(layout).not.toContain("<SeasonalEffects />")
    expect(layout).not.toContain("<NoiseOverlay />")
  })

  it("keeps particle controls between season and theme controls", () => {
    const navbar = read("components/layout/Navbar.tsx")
    const editorTopBar = read("components/editor/EditorTopBar.tsx")

    const sources = [navbar, editorTopBar]

    sources.forEach((source) => {
      const seasonIndex = source.indexOf("<SeasonToggle />")
      const particleIndex = source.indexOf("<ParticleToggle />")
      const themeIndex = source.indexOf("<ThemeToggle />")

      expect(seasonIndex).toBeGreaterThan(-1)
      expect(particleIndex).toBeGreaterThan(seasonIndex)
      expect(themeIndex).toBeGreaterThan(particleIndex)
    })
  })

  it("uses Vietnamese default social preview metadata", () => {
    const layout = read("app/layout.tsx")
    const seo = read("lib/seo.ts")

    expect(seo).toContain("Top 1 sakuku vi en")
    expect(seo).not.toContain("In-depth anime analysis")
    expect(layout).toContain('url: "/og-default.png"')
    expect(layout).toContain('images: ["/og-default.png"]')
    expect(layout).toContain('alt: "Eizou Blog"')
    expect(layout).toContain('card: "summary_large_image"')
  })
})
