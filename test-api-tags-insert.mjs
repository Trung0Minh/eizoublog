import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function run() {
  const user = await prisma.user.findFirst()
  let post = await prisma.post.findFirst({ include: { tags: true } })
  if (!post) {
      post = await prisma.post.create({ data: { title: "Test", slug: "test-slug", authorId: user.id } })
  }
  let tag = await prisma.tag.findFirst()
  if (!tag) {
      tag = await prisma.tag.create({ data: { name: "Test Tag", slug: "test-tag" } })
  }
  if (post.tags.length === 0) {
      await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } })
  }
  
  try {
    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        data: {
          tags: {
            create: [ { tag: { connect: { id: tag.id } } } ],
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
