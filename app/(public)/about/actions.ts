"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getAboutPage() {
  const page = await prisma.sitePage.findUnique({
    where: { slug: "about" },
  })
  return page
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateAboutPage(content: any, contentText: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const page = await prisma.sitePage.upsert({
    where: { slug: "about" },
    update: { content, contentText },
    create: {
      slug: "about",
      title: "About",
      content,
      contentText,
    },
  })

  return page
}
