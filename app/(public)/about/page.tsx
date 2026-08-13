import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { getCachedSitePage } from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"
import { AboutClient } from "./AboutClient"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    canonicalPath: "/about",
    description: "Kho lưu trữ các bài viết xịn xò bởi cộng đồng fan sakuku vi en",
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
