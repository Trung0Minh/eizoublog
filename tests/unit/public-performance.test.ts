import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("public navigation performance contracts", () => {
  it("keeps editable public pages cacheable without server-side auth", () => {
    for (const pagePath of [
      "app/(public)/about/page.tsx",
      "app/(public)/resources/page.tsx",
      "app/(public)/nhap-mon-sakuga/page.tsx",
    ]) {
      const page = read(pagePath)

      expect(page).toContain("getCachedSitePage")
      expect(page).toContain("export const revalidate = 300")
      expect(page).not.toContain('from "@/lib/auth"')
      expect(page).not.toContain('from "@/lib/prisma"')
    }
  })

  it("moves homepage admin access behind the shared client session", () => {
    const home = read("app/(public)/page.tsx")

    expect(home).toContain("ClientAdminBackgroundFlyout")
    expect(home).not.toContain("getActiveSession")
  })

  it("defers admin-only editor and upload bundles on reader pages", () => {
    for (const clientPath of [
      "app/(public)/about/AboutClient.tsx",
      "app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx",
    ]) {
      const client = read(clientPath)

      expect(client).toContain('from "next/dynamic"')
      expect(client).toContain("dynamic(")
      expect(client).not.toContain(
        'import { TiptapEditor } from "@/components/editor/TiptapEditor"',
      )
      expect(client).not.toContain(
        'import { CoverImageUpload } from "@/components/posts/CoverImageUpload"',
      )
    }
  })

  it("preserves the existing navigation and reveal animation timings", () => {
    const rootTemplate = read("app/template.tsx")
    const publicTemplate = read("app/(public)/template.tsx")
    const scrollReveal = read("components/ui/ScrollReveal.tsx")

    expect(rootTemplate).toContain("initial={{ opacity: 0, y: 15 }}")
    expect(rootTemplate).toContain("duration: 0.5")
    expect(publicTemplate).toContain("initial={{ opacity: 0 }}")
    expect(publicTemplate).toContain("duration: 0.4")
    expect(scrollReveal).toContain("initial={{ opacity: 0, y: 30 }}")
    expect(scrollReveal).toContain("duration: 0.6")
  })
})
