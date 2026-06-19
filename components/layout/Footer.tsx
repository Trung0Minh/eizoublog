import Link from "next/link"
import { MagneticEffect } from "@/components/ui/MagneticEffect"

export function Footer() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Anime Blog"
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border-default mt-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[13px] text-text-secondary">
          &copy; {year} {appName}.
        </p>
        <nav aria-label="Footer navigation" className="flex items-center gap-6 text-[13px] text-text-secondary">
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
        </nav>
      </div>
    </footer>
  )
}
