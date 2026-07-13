import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

function isRscNavigation(request: Pick<NextRequest, "headers">) {
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-State-Tree") !== null
  )
}

const protectedProxy = auth((request) => {
  const { pathname } = request.nextUrl
  const session = request.auth
  const isWriterRoute = pathname.startsWith("/dashboard")
  const isAdminRoute = pathname.startsWith("/admin")

  if ((isWriterRoute || isAdminRoute) && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute && session?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (isWriterRoute && session?.user.role === "REVOKED") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
})
const runProtectedProxy = protectedProxy as unknown as NextMiddleware

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (isRscNavigation(request)) {
    return NextResponse.next()
  }

  return runProtectedProxy(request, event)
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
