import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const post = await prisma.post.findFirst({ where: { status: "PUBLISHED" } })
  if (!post) throw new Error("No published post found")
  
  try {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
      }
    })
    console.log("Empty update success")
    
    const tags = await prisma.postTag.findMany({ where: { postId: post.id } })
    await prisma.post.update({
      where: { id: post.id },
      data: {
        tags: {
          deleteMany: {},
          create: tags.map(t => ({ tag: { connect: { id: t.tagId } } }))
        }
      }
    })
    console.log("Tags update success")
  } catch (e) {
    console.error("Prisma error:", e)
  }
}
main().finally(() => prisma.$disconnect())
