const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const post = await prisma.post.findFirst();
  if (!post) throw new Error("No post");
  
  // Update tags via prisma directly
  try {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        tags: {
          deleteMany: {},
          create: [ { tag: { connect: { id: "test" } } } ]
        }
      }
    });
    console.log("Success");
  } catch (e) {
    console.error("Prisma error:", e);
  }
}
main().finally(() => prisma.$disconnect());
