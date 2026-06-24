import { NextResponse } from "next/server"
import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const page = await prisma.sitePage.findUnique({
      where: { slug: "site-settings-backgrounds" },
    })
    return NextResponse.json({ data: page?.content || {} })
  } catch (error) {
    console.error("[SETTINGS_BACKGROUNDS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const body = await req.json()
    const { backgrounds } = body

    if (!backgrounds || typeof backgrounds !== "object") {
      return NextResponse.json({ error: "Invalid backgrounds data" }, { status: 400 })
    }

    const page = await prisma.sitePage.upsert({
      where: { slug: "site-settings-backgrounds" },
      create: {
        slug: "site-settings-backgrounds",
        title: "Site Settings: Backgrounds",
        content: backgrounds,
      },
      update: {
        content: backgrounds,
      },
    })

    return NextResponse.json({ data: page.content })
  } catch (error) {
    console.error("[SETTINGS_BACKGROUNDS_POST]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
