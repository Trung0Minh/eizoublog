import { ZodError, z } from "zod"

import { prisma } from "@/lib/prisma"

const tokenQuerySchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
})

function notFound() {
  return Response.json({ error: "Not found" }, { status: 404 })
}

function isTestRouteEnabled() {
  return (
    process.env.NODE_ENV === "test" ||
    (process.env.NODE_ENV === "development" &&
      process.env.PLAYWRIGHT_TEST === "1")
  )
}

export async function GET(request: Request) {
  if (!isTestRouteEnabled()) {
    return notFound()
  }

  try {
    const { searchParams } = new URL(request.url)
    const { email } = tokenQuerySchema.parse(
      Object.fromEntries(searchParams),
    )

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      select: { token: true },
      where: { email },
    })

    if (!subscriber) {
      return Response.json({ error: "Subscriber not found" }, { status: 404 })
    }

    return Response.json({ data: { token: subscriber.token } })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    console.error("[GET /api/test/newsletter-token]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
