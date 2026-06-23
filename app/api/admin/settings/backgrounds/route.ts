import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
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
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
