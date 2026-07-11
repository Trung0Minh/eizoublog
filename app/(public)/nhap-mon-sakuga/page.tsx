import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { getCachedSitePage } from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"
import { IntroToSakugaClient } from "./IntroToSakugaClient"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    canonicalPath: "/nhap-mon-sakuga",
    description: "Hướng dẫn toàn diện tích hợp link giới thiệu các tài liệu uy tín nhất cho người mới bắt đầu tiếp cận Sakuga và ngành sản xuất anime.",
    title: "Nhập môn Sakuga",
  })
}

export default async function IntroToSakugaPage() {
  const page = await getCachedSitePage("nhap-mon-sakuga")

  return (
    <PageContainer>
      <IntroToSakugaClient initialPage={page} />
    </PageContainer>
  )
}
