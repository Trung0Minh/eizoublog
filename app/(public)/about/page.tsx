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
    description: `${appName} là blog biên tập dành cho các bài phân tích, bình luận và góc nhìn hậu trường sản xuất anime.`,
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
