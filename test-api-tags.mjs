import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function run() {
  const post = await prisma.post.findFirst({ where: { status: "PUBLISHED" }, include: { tags: true } })
  if (!post || post.tags.length === 0) throw new Error("no post with tags")
  
  try {
    const tx = prisma
    await tx.post.update({
        data: {
          tags: {
            create: post.tags.map(t => ({ tag: { connect: { id: t.tagId } } })),
            deleteMany: {},
          },
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
