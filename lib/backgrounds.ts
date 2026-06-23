import { prisma } from "@/lib/prisma"

export async function getCustomBackgrounds() {
  try {
    const page = await prisma.sitePage.findUnique({
      where: { slug: "site-settings-backgrounds" }
    })
    if (page && page.content) {
      return page.content as Record<string, string>
    }
  } catch (e) {
    console.error("Error fetching backgrounds", e)
  }
  return null
}
