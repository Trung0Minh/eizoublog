import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { getCachedSitePage } from "@/lib/queries"
import { buildMetadata, getAppName } from "@/lib/seo"
import { AboutClient } from "./AboutClient"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const appName = getAppName()

  return buildMetadata({
    canonicalPath: "/about",
    description: `${appName} is an invite-only editorial blog for anime analysis, reviews, and production insight.`,
    title: "Giới thiệu",
  })
}

export default async function AboutPage() {
  const page = await getCachedSitePage("about")

  return (
    <PageContainer>
      <AboutClient initialPage={page} />
    </PageContainer>
  )
}
