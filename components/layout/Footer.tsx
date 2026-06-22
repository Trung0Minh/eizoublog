"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MagneticEffect } from "@/components/ui/MagneticEffect"

export function Footer() {
  const pathname = usePathname()
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"
  const year = new Date().getFullYear()

  // Hide footer on editor and admin pages
  const isEditorRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/edit") ||
    pathname.startsWith("/dashboard/new")

  if (isEditorRoute) return null

  return (
    <footer className="border-t border-border-default mt-12">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[13px] text-text-secondary">
          &copy; {year} {appName}. Developed by nun.
        </p>
        <nav aria-label="Footer navigation" className="flex items-center gap-6 text-[13px] text-text-secondary">
          <MagneticEffect>
            <Link
              className="hover:text-text-primary transition-colors"
              href="/nhap-mon-sakuga"
            >
              Nhập môn Sakuga
            </Link>
          </MagneticEffect>
          <MagneticEffect>
            <Link
              className="hover:text-text-primary transition-colors"
              href="/contributors"
            >
              Đóng góp
            </Link>
          </MagneticEffect>
          <MagneticEffect>
            <Link
              className="hover:text-text-primary transition-colors"
              href="/resources"
            >
              Nguồn tham khảo
            </Link>
          </MagneticEffect>
          <MagneticEffect>
            <Link
              className="hover:text-text-primary transition-colors"
              href="/about"
            >
              Giới thiệu
            </Link>
          </MagneticEffect>
          <MagneticEffect>
            <a
              className="hover:text-text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full"
              href="https://discord.gg/wgCr86Cdb"
              target="_blank"
              rel="noopener noreferrer"
              title="Discord"
            >
              <svg viewBox="0 0 127.14 96.36" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.8,6.83,77.19,77.19,0,0,0,49.5,0,105.15,105.15,0,0,0,19.06,8.07C3.12,31.78-1.2,54.85,.3,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1-.73,2-1.5,2.92-2.3A75.7,75.7,0,0,0,96,78.23c.93,.8,1.93,1.57,2.92,2.3a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.71-18.83C128.7,54.85,124.3,31.78,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
              </svg>
            </a>
          </MagneticEffect>
        </nav>
      </div>
    </footer>
  )
}
