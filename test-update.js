import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const post = await prisma.post.findFirst({ where: { status: "PUBLISHED" } })
  if (!post) throw new Error("No published post found")
  
  try {
    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: post.id },
        data: {
          tags: {
            deleteMany: {},
            create: [ { tag: { connect: { id: "clx123..." } } } ]
          }
        }
      })
    })
    console.log("Empty update success")
  } catch (e) {
    console.error("Prisma error:", e)
  }
}
main().finally(() => prisma.$disconnect())
