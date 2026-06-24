import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

describe("dead production code cleanup", () => {
  it("removes obsolete components that are not part of the current UI", () => {
    const obsoleteFiles = [
      "components/editor/BubbleMenu.tsx",
      "components/posts/PostHeader.tsx",
      "components/posts/PostListSkeleton.tsx",
      "components/search/SearchBar.tsx",
      "components/ui/AnimatedDecorators.tsx",
      "components/ui/Magnetic.tsx",
      "components/ui/SkeletonCard.tsx",
      "components/ui/separator.tsx",
    ]

    for (const file of obsoleteFiles) {
      expect(existsSync(join(root, file)), file).toBe(false)
    }
  })

  it("keeps the active post hero independent from the obsolete post header", () => {
    const postHero = readFileSync(
      join(root, "components/posts/PostHero.tsx"),
      "utf8",
    )
    const postTypes = readFileSync(join(root, "types/posts.ts"), "utf8")

    expect(postHero).toContain('from "@/types/posts"')
    expect(postHero).not.toContain("./PostHeader")
    expect(postTypes).toContain("export interface PostHeroPost")
  })

  it("keeps reading progress on posts without mounting a global duplicate", () => {
    const globalEffects = readFileSync(
      join(root, "components/ui/GlobalEffects.tsx"),
      "utf8",
    )
    const postPage = readFileSync(
      join(root, "app/(public)/[slug]/page.tsx"),
      "utf8",
    )

    expect(existsSync(join(root, "components/ui/ReadingProgress.tsx"))).toBe(
      false,
    )
    expect(globalEffects).not.toContain("ReadingProgress")
    expect(postPage).toContain(
      'import { ReadingProgress } from "@/components/posts/ReadingProgress"',
    )
    expect(postPage).toContain("<ReadingProgress />")
  })

  it("keeps touched production files free from explicit any escapes", () => {
    const files = [
      "app/(public)/about/actions.ts",
      "app/(public)/resources/ResourcesClient.tsx",
      "app/(public)/resources/actions.ts",
      "components/editor/extensions/TrailingNodeExtension.ts",
      "components/home/HomeIntro.tsx",
      "components/ui/button.tsx",
    ]

    for (const file of files) {
      const source = readFileSync(join(root, file), "utf8")
      expect(source, file).not.toMatch(/\bany\b/)
    }
  })

  it("removes confirmed unused symbols while preserving homepage sorting", () => {
    const homePage = readFileSync(
      join(root, "app/(public)/page.tsx"),
      "utf8",
    )
    const aboutClient = readFileSync(
      join(root, "app/(public)/about/AboutClient.tsx"),
      "utf8",
    )
    const mediaUpload = readFileSync(
      join(root, "components/editor/MediaUpload.tsx"),
      "utf8",
    )
    const lightbox = readFileSync(
      join(root, "components/posts/ImageLightbox.tsx"),
      "utf8",
    )

    expect(homePage).toContain("parsePostListSort")
    expect(homePage).not.toContain("getCachedPublishedPosts")
    expect(homePage).not.toContain("import type { PostListSort }")
    expect(aboutClient).not.toMatch(/\b(?:Plus|Trash2|appName)\b/)
    expect(mediaUpload).not.toMatch(/\b(?:Loader2|getUploadUrl|getUploadUrls)\b/)
    expect(lightbox).not.toContain("setScale")
    expect(existsSync(join(root, "tests/integration/test-repro.test.ts"))).toBe(
      false,
    )
  })
})
