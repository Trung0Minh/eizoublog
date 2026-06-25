import { unstable_cache } from "next/cache"

import { prisma } from "@/lib/prisma"

export const getCustomBackgrounds = unstable_cache(
  async () => {
    try {
      const page = await prisma.sitePage.findUnique({
        select: { content: true },
        where: { slug: "site-settings-backgrounds" },
      })

      return page?.content
        ? (page.content as Record<string, string>)
        : null
    } catch (error) {
      console.error("[CUSTOM_BACKGROUNDS]", error)
      return null
    }
  },
  ["custom-backgrounds"],
  { revalidate: 300, tags: ["backgrounds"] },
)
