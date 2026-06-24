"use server"

import type { Prisma } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getAboutPage() {
  const page = await prisma.sitePage.findUnique({
    where: { slug: "about" },
  })
  return page
}

export async function updateAboutPage(
  content: Prisma.InputJsonValue,
  contentText: string,
) {
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
