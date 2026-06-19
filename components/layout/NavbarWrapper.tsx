"use client"

import { usePathname } from "next/navigation"

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const isEditorRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/edit") ||
    pathname.startsWith("/dashboard/new")
  
  if (isEditorRoute) {
    return null
  }
  
  return <>{children}</>
}
