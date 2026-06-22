import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildMetadata, getAppName } from "@/lib/seo"
import { IntroToSakugaClient } from "./IntroToSakugaClient"

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    canonicalPath: "/nhap-mon-sakuga",
    description: "Hướng dẫn toàn diện tích hợp link giới thiệu các tài liệu uy tín nhất cho người mới bắt đầu tiếp cận Sakuga và ngành sản xuất anime.",
    title: "Nhập môn Sakuga",
  })
}

export default async function IntroToSakugaPage() {
  const appName = getAppName()
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const page = await prisma.sitePage.findUnique({
    where: { slug: "nhap-mon-sakuga" },
  })

  return (
    <PageContainer>
      <IntroToSakugaClient initialPage={page} isAdmin={isAdmin} appName={appName} />
    </PageContainer>
  )
}
