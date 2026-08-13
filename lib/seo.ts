import type { Metadata } from "next"

const FALLBACK_APP_NAME = "Anime Blog"
const FALLBACK_APP_URL = "http://localhost:3000"

export const DEFAULT_DESCRIPTION =
  "Top 1 sakuku vi en"

export function getAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME ?? FALLBACK_APP_NAME
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_APP_URL).replace(/\/$/, "")
}

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) {
    return pathOrUrl
  }

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`

  if (path === "/") {
    return getAppUrl()
  }

  if (path.startsWith("/?")) {
    return `${getAppUrl()}${path.slice(1)}`
  }

  return `${getAppUrl()}${path}`
}

interface BuildMetadataOptions {
  canonicalPath?: string
  canonicalUrl?: string
  description?: string
  noIndex?: boolean
  noIndexFollow?: boolean
  ogImage?: string
  ogImageHeight?: number
  ogImageWidth?: number
  ogType?: "article" | "website"
  title?: string
}

export function buildMetadata({
  canonicalPath = "/",
  canonicalUrl,
  description = DEFAULT_DESCRIPTION,
  noIndex = false,
  noIndexFollow = false,
  ogImage = "/og-default.png",
  ogImageHeight = 630,
  ogImageWidth = 1200,
  ogType = "website",
  title,
}: BuildMetadataOptions = {}): Metadata {
  const appName = getAppName()
  const appUrl = getAppUrl()
  const canonical = canonicalUrl ?? absoluteUrl(canonicalPath)
  const pageTitle: Metadata["title"] = title ?? { absolute: appName }
  const socialTitle = title ? `${title} | ${appName}` : appName
  const imageUrl = absoluteUrl(ogImage)

  return {
    alternates: {
      canonical,
    },
    description,
    metadataBase: new URL(appUrl),
    openGraph: {
      description,
      images: [
        {
          alt: socialTitle,
          height: ogImageHeight,
          url: imageUrl,
          width: ogImageWidth,
        },
      ],
      locale: "vi_VN",
      siteName: appName,
      title: socialTitle,
      type: ogType,
      url: canonical,
    },
    ...(noIndex && {
      robots: { follow: noIndexFollow, index: false },
    }),
    title: pageTitle,
    twitter: {
      card: "summary_large_image",
      description,
      images: [imageUrl],
      title: socialTitle,
    },
  }
}
