import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { buildMetadata, getAppName } from "@/lib/seo"
import { getCachedSitePage } from "@/lib/queries"
import { ResourcesClient } from "./ResourcesClient"

export const revalidate = 300

export const metadata: Metadata = buildMetadata({
  canonicalPath: "/resources",
  description: "Tổng hợp nguồn tham khảo siu cấp vjp pro",
  title: "Nguồn tham khảo",
})

export default async function ResourcesPage() {
  const appName = getAppName()
  const page = await getCachedSitePage("resources")

  return (
    <PageContainer>
      <ResourcesClient initialPage={page} appName={appName} />
    </PageContainer>
  )
}
