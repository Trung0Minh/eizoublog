import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildMetadata, getAppName } from "@/lib/seo"
import { AboutClient } from "./AboutClient"

export async function generateMetadata(): Promise<Metadata> {
  const appName = getAppName()

  return buildMetadata({
    canonicalPath: "/about",
    description: `${appName} is an invite-only editorial blog for anime analysis, reviews, and production insight.`,
    title: "Giới thiệu",
  })
}

export default async function AboutPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const page = await prisma.sitePage.findUnique({
    where: { slug: "about" },
  })

  return (
    <PageContainer>
      <AboutClient initialPage={page} isAdmin={isAdmin} />
    </PageContainer>
  )
}
