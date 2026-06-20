import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function run() {
  const user = await prisma.user.findFirst()
  let post = await prisma.post.findFirst({ include: { tags: true } })
  if (!post) {
      post = await prisma.post.create({ data: { title: "Test", slug: "test-slug-2", authorId: user.id } })
  }
  let tag1 = await prisma.tag.findFirst({ where: { slug: "test-tag-1" } })
  if (!tag1) tag1 = await prisma.tag.create({ data: { name: "Test Tag 1", slug: "test-tag-1" } })
  
  let tag2 = await prisma.tag.findFirst({ where: { slug: "test-tag-2" } })
  if (!tag2) tag2 = await prisma.tag.create({ data: { name: "Test Tag 2", slug: "test-tag-2" } })
  
  try {
    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        data: {
          tags: {
            create: [ { tag: { connect: { id: tag1.id } } }, { tag: { connect: { id: tag2.id } } } ],
            deleteMany: {},
          },
        },
        where: { id: post.id },
      })
    })
    console.log("Success")
  } catch(e) {
    console.error("Prisma Error:", e)
  }
}
run().finally(() => prisma.$disconnect())
