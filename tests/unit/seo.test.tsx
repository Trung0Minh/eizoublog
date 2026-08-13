import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it } from "vitest"

import {
  buildMetadata,
  getAppUrl,
} from "@/lib/seo"
import { buildPostJsonLd, PostJsonLd } from "@/components/posts/PostJsonLd"

describe("buildMetadata", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_NAME = "Eizou Blog"
    process.env.NEXT_PUBLIC_APP_URL = "https://eizou.example"
  })

  it("builds consistent default Open Graph, Twitter, and canonical metadata", () => {
    const metadata = buildMetadata({
      canonicalPath: "/frieren-memory",
      description: "A close read of memory in Frieren.",
      ogImage: "https://cdn.example.com/frieren.jpg",
      ogType: "article",
      title: "Frieren and memory",
    })

    expect(metadata.title).toBe("Frieren and memory")
    expect(metadata.description).toBe("A close read of memory in Frieren.")
    expect(metadata.metadataBase).toEqual(new URL("https://eizou.example"))
    expect(metadata.alternates).toEqual({
      canonical: "https://eizou.example/frieren-memory",
    })
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        description: "A close read of memory in Frieren.",
        locale: "vi_VN",
        siteName: "Eizou Blog",
        title: "Frieren and memory | Eizou Blog",
        type: "article",
        url: "https://eizou.example/frieren-memory",
      }),
    )
    expect(metadata.openGraph).toHaveProperty("images", [
      {
        alt: "Frieren and memory | Eizou Blog",
        height: 630,
        url: "https://cdn.example.com/frieren.jpg",
        width: 1200,
      },
    ])
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      description: "A close read of memory in Frieren.",
      images: ["https://cdn.example.com/frieren.jpg"],
      title: "Frieren and memory | Eizou Blog",
    })
  })

  it("supports noindex metadata with configurable follow behavior", () => {
    expect(buildMetadata({ noIndex: true }).robots).toEqual({
      follow: false,
      index: false,
    })
    expect(buildMetadata({ noIndex: true, noIndexFollow: true }).robots).toEqual(
      {
        follow: true,
        index: false,
      },
    )
  })

  it("supports square Open Graph images", () => {
    const metadata = buildMetadata({
      ogImage: "https://cdn.example.com/avatar.jpg",
      ogImageHeight: 512,
      ogImageWidth: 512,
      title: "Mina Writer",
    })

    expect(metadata.openGraph).toHaveProperty("images", [
      {
        alt: "Mina Writer | Eizou Blog",
        height: 512,
        url: "https://cdn.example.com/avatar.jpg",
        width: 512,
      },
    ])
  })

  it("normalizes trailing slashes in the app URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://eizou.example/"

    expect(getAppUrl()).toBe("https://eizou.example")
    expect(buildMetadata({ canonicalPath: "/search" }).alternates).toEqual({
      canonical: "https://eizou.example/search",
    })
  })
})

describe("PostJsonLd", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_NAME = "Eizou Blog"
    process.env.NEXT_PUBLIC_APP_URL = "https://eizou.example"
  })

  const post = {
    authorName: "Mina Writer",
    coverUrl: "https://cdn.example.com/frieren.jpg",
    description: "A close read of memory.",
    publishedAt: new Date("2026-01-02T03:04:05.000Z"),
    slug: "frieren-memory",
    title: "Frieren and memory",
    updatedAt: new Date("2026-01-03T03:04:05.000Z"),
  }

  it("builds article JSON-LD without private fields", () => {
    expect(buildPostJsonLd(post)).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      author: {
        "@type": "Person",
        name: "Mina Writer",
      },
      dateModified: "2026-01-03T03:04:05.000Z",
      datePublished: "2026-01-02T03:04:05.000Z",
      description: "A close read of memory.",
      headline: "Frieren and memory",
      image: "https://cdn.example.com/frieren.jpg",
      mainEntityOfPage: {
        "@id": "https://eizou.example/frieren-memory",
        "@type": "WebPage",
      },
      publisher: {
        "@type": "Organization",
        name: "Eizou Blog",
        url: "https://eizou.example",
      },
    })
    expect(JSON.stringify(buildPostJsonLd(post))).not.toContain("authorEmail")
  })

  it("renders an application/ld+json script", () => {
    const html = renderToStaticMarkup(<PostJsonLd {...post} />)

    expect(html).toContain('type="application/ld+json"')
    expect(html).toContain("Frieren and memory")
    expect(html).toContain("https://schema.org")
  })
})
