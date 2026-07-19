import { PrismaClient, Role } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      username: "admin",
      role: Role.ADMIN,
      bio: "Blog administrator",
    },
  })

  await prisma.category.upsert({
    where: { slug: "analysis" },
    update: {},
    create: {
      name: "Analysis",
      slug: "analysis",
      description: "In-depth breakdowns of animation, story, and characters",
    },
  })

  await prisma.category.upsert({
    where: { slug: "reviews" },
    update: {},
    create: {
      name: "Reviews",
      slug: "reviews",
      description: "Episodic and series reviews",
    },
  })

  await prisma.category.upsert({
    where: { slug: "animation-analysis" },
    update: {},
    create: {
      name: "Animation Analysis",
      slug: "animation-analysis",
      description: "Analysis of animation craft and movement",
    },
  })

  await prisma.category.upsert({
    where: { slug: "narrative-analysis" },
    update: {},
    create: {
      name: "Narrative Analysis",
      slug: "narrative-analysis",
      description: "Analysis of narrative structure and storytelling",
    },
  })

  const tagNames = [
    "Ufotable",
    "MAPPA",
    "WIT Studio",
    "Science SARU",
    "Sakuga",
    "Shonen",
    "Seinen",
    "Josei",
  ]

  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/\s+/g, "-")

    await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })
  }

  console.log("Seed completed. Admin user:", admin.email)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
