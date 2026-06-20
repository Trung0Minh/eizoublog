import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function run() {
  const post = await prisma.post.findFirst({ where: { status: "PUBLISHED" } })
  if (!post) throw new Error("no post")
  
  try {
    const tx = prisma
    await tx.post.update({
        data: {
          category: { disconnect: true },
          content: { type: "doc", content: [{ type: "paragraph" }] },
          contentText: "text",
          coverAlt: null,
          coverUrl: null,
          draftVisibility: "PRIVATE",
          excerpt: null,
          lastSavedAt: new Date(),
          publishedAt: new Date(),
          status: "PUBLISHED",
          tags: {
            create: [],
            deleteMany: {},
          },
          title: post.title,
        },
        select: { id: true, slug: true, status: true, updatedAt: true },
        where: { id: post.id },
      })
      console.log("Success")
  } catch(e) {
    console.error("Prisma Error:", e)
  }
}

run().finally(() => prisma.$disconnect())
