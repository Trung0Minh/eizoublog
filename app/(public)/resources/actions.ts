"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function updateResourcesPage(content: any) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const page = await prisma.sitePage.upsert({
    where: { slug: "resources" },
    update: { content },
    create: {
      slug: "resources",
      title: "Resources",
      content,
    },
  })

  return page
}
