import Link from "next/link"
import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { EmptyState } from "@/components/ui/EmptyState"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { TextReveal } from "@/components/ui/TextReveal"
import { getCachedPublicCategories } from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  canonicalPath: "/category",
  description: "Tất cả chuyên mục đang có bài viết trên Eizou Blog.",
  title: "Danh mục",
})

export default async function CategoryIndexPage() {
  const categories = await getCachedPublicCategories()

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <ScrollReveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Danh mục
          </p>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">
            <TextReveal text="Tất cả danh mục" />
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Duyệt toàn bộ chuyên mục đang có bài viết đã xuất bản.
          </p>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.2}>
        {categories.length === 0 ? (
          <EmptyState
            description="Chưa có danh mục nào có bài viết đã xuất bản."
            title="Không tìm thấy danh mục"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                className="group flex min-h-24 flex-col justify-between rounded-[8px] border border-border-default/70 bg-background/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-subtle-bg/70"
                href={`/category/${category.slug}`}
                key={category.slug}
              >
                <span className="text-[15px] font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {category.name}
                </span>
                <span className="mt-3 text-[13px] text-text-secondary">
                  {category.count} bài viết
                </span>
              </Link>
            ))}
          </div>
        )}
      </ScrollReveal>
    </PageContainer>
  )
}
