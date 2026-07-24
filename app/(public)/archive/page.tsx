import Link from "next/link"
import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { EmptyState } from "@/components/ui/EmptyState"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { TextReveal } from "@/components/ui/TextReveal"
import { getCachedPublicArchives } from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  canonicalPath: "/archive",
  description: "Tất cả tháng lưu trữ có bài viết đã xuất bản.",
  title: "Lưu trữ",
})

function formatArchiveMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month
  }

  const [yearPart, monthPart] = month.split("-")
  const monthNumber = Number(monthPart)

  if (monthNumber < 1 || monthNumber > 12) {
    return month
  }

  return `${monthPart}/${yearPart}`
}

export default async function ArchiveIndexPage() {
  const archives = await getCachedPublicArchives()

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <ScrollReveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Lưu trữ
          </p>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">
            <TextReveal text="Tất cả lưu trữ" />
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Duyệt bài viết theo từng tháng xuất bản.
          </p>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.2}>
        {archives.length === 0 ? (
          <EmptyState
            description="Chưa có tháng lưu trữ nào."
            title="Không tìm thấy lưu trữ"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archives.map((archive) => (
              <Link
                className="group flex min-h-24 flex-col justify-between rounded-[8px] border border-border-default/70 bg-background/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-subtle-bg/70"
                href={`/archive/${archive.month}`}
                key={archive.month}
              >
                <span className="text-[15px] font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {formatArchiveMonth(archive.month)}
                </span>
                <span className="mt-3 text-[13px] text-text-secondary">
                  {archive.count} bài viết
                </span>
              </Link>
            ))}
          </div>
        )}
      </ScrollReveal>
    </PageContainer>
  )
}
