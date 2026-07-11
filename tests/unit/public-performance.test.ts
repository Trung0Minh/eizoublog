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

  it("keeps the homepage hero visible in server-rendered HTML", () => {
    const homeIntro = read("components/home/HomeIntro.tsx")

    expect(homeIntro).not.toContain("if (!mounted) return")
    expect(homeIntro).not.toContain("useSyncExternalStore")
    expect(homeIntro).toContain("initialSeason")
    expect(homeIntro).toContain('initial="hidden"')
  })

  it("warms the homepage route during browser idle time", () => {
    const rootLayout = read("app/layout.tsx")
    const prefetch = read("components/ui/HomeRoutePrefetch.tsx")

    expect(rootLayout).toContain("HomeRoutePrefetch")
    expect(prefetch).toContain('router.prefetch("/")')
    expect(prefetch).toContain("requestIdleCallback")
  })

  it("isolates the filtered background from route-loader compositing", () => {
    const background = read("components/ui/DynamicBackground.tsx")

    expect(background).toContain('willChange: "filter, opacity, transform"')
    expect(background).toContain('backfaceVisibility: "hidden"')
    expect(background).toContain('translate3d(0, 0, 0)')
  })

  it("uses the server-resolved season for the global background", () => {
    const rootLayout = read("app/layout.tsx")
    const background = read("components/ui/DynamicBackground.tsx")

    expect(rootLayout).toContain("initialSeason={initialSeason}")
    expect(background).toContain("initialSeason: AppearanceSeason")
    expect(background).not.toContain('useState("spring")')
  })

  it("keeps the current page mounted instead of replacing it with a transparent route loader", () => {
    for (const loadingPath of [
      "app/(public)/loading.tsx",
      "app/(writer)/dashboard/loading.tsx",
      "app/(writer)/dashboard/events/loading.tsx",
      "app/(admin)/admin/loading.tsx",
    ]) {
      expect(() => read(loadingPath)).toThrow()
    }
  })

  it("prevents browser reload scroll restoration from accumulating offsets", () => {
    const rootLayout = read("app/layout.tsx")
    const scrollReset = read("components/ui/RouteScrollReset.tsx")

    expect(rootLayout).toContain("history.scrollRestoration = 'manual'")
    expect(scrollReset).toContain("window.scrollTo({ left: 0, top: 0, behavior: \"instant\" })")
    expect(scrollReset).not.toContain("previousPathnameRef.current === pathname")
  })

  it("server-renders the background instead of returning a blank hydration frame", () => {
    const rootLayout = read("app/layout.tsx")
    const background = read("components/ui/DynamicBackground.tsx")

    expect(rootLayout).toContain("initialTheme={initialTheme}")
    expect(background).toContain("initialTheme: AppearanceTheme")
    expect(background).not.toContain("if (!mounted) return null")
    expect(background).toContain("initial={mounted ? { opacity: 0 } : false}")
  })
})
