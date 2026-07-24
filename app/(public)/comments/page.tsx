import Link from "next/link"
import type { Metadata } from "next"

import { PageContainer } from "@/components/layout/PageContainer"
import { EmptyState } from "@/components/ui/EmptyState"
import { Pagination } from "@/components/ui/Pagination"
import { RelativeTime } from "@/components/ui/RelativeTime"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { TextReveal } from "@/components/ui/TextReveal"
import { getCachedPublicComments } from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"

interface CommentsPageProps {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 10

export const metadata: Metadata = buildMetadata({
  canonicalPath: "/comments",
  description: "Những bình luận mới nhất trên Eizou Blog.",
  title: "Bình luận gần đây",
})

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")
  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export default async function CommentsPage({
  searchParams,
}: CommentsPageProps) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { comments, total } = await getCachedPublicComments(page, PAGE_SIZE)

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <ScrollReveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Bình luận
          </p>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">
            <TextReveal text="Bình luận gần đây" />
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Theo dõi các cuộc trò chuyện mới nhất dưới những bài viết đã xuất bản.
          </p>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.2}>
        {comments.length === 0 ? (
          <EmptyState
            description="Chưa có bình luận nào được hiển thị."
            title="Không tìm thấy bình luận"
          />
        ) : (
          <section>
            <div className="flex flex-col">
              {comments.map((comment) => (
                <article
                  className="border-b border-border-default/60 py-6 first:pt-0 last:border-b-0"
                  key={comment.id}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                    <span className="font-semibold text-text-primary">
                      {comment.authorName}
                    </span>
                    <span className="text-text-tertiary">trong</span>
                    <Link
                      className="font-medium text-text-primary hover:text-accent hover:underline"
                      href={`/${comment.post.slug}`}
                    >
                      {comment.post.title}
                    </Link>
                    <span className="text-text-tertiary">·</span>
                    <RelativeTime
                      className="text-text-tertiary"
                      date={comment.createdAt}
                    />
                  </div>
                  <Link
                    className="block rounded-[8px] border border-transparent p-3 -mx-3 transition-colors hover:border-border-default/70 hover:bg-subtle-bg/60"
                    href={`/${comment.post.slug}#comment-${comment.id}`}
                  >
                    <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-text-secondary line-clamp-4">
                      {comment.content}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
          </section>
        )}
      </ScrollReveal>
    </PageContainer>
  )
}
