import { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { getAppName } from "@/lib/seo"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ResourcesClient } from "./ResourcesClient"

export const metadata: Metadata = {
  title: "Nguồn tham khảo",
  description: "Các trang web, cộng đồng và nguồn tài liệu uy tín về anime và diễn hoạt (sakuga) được chúng tôi tin tưởng và sử dụng.",
}

export default async function ResourcesPage() {
  const appName = getAppName()
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const page = await prisma.sitePage.findUnique({
    where: { slug: "resources" },
  })

  return (
    <PageContainer>
      <ResourcesClient initialPage={page} isAdmin={isAdmin} appName={appName} />
    </PageContainer>
  )
}
