import { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { getAppName } from "@/lib/seo"
import { getCachedSitePage } from "@/lib/queries"
import { ResourcesClient } from "./ResourcesClient"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Nguồn tham khảo",
  description: "Các trang web, cộng đồng và nguồn tài liệu uy tín về anime và diễn hoạt (sakuga) được chúng tôi tin tưởng và sử dụng.",
}

export default async function ResourcesPage() {
  const appName = getAppName()
  const page = await getCachedSitePage("resources")

  return (
    <PageContainer>
      <ResourcesClient initialPage={page} appName={appName} />
    </PageContainer>
  )
}
