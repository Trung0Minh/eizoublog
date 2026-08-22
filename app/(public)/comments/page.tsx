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
    <PageContainer className="py-6 md:py-10 lg:py-14">
      <div className="relative isolate overflow-hidden rounded-[24px] border-2 border-border-default bg-background shadow-[0_24px_80px_rgba(27,20,35,0.16)] ring-1 ring-white/50 dark:ring-white/5 md:rounded-[32px]">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5 bg-accent"
        />
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
        />

        <section className="relative border-b-2 border-border-default px-5 pb-8 pt-10 sm:px-8 md:px-12 md:pb-10 md:pt-12">
          <ScrollReveal>
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-8">
              <div className="max-w-3xl">
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-accent">
                  Dòng thảo luận
                </p>
                <h1 className="text-[clamp(2.25rem,5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-text-primary [font-family:var(--font-display)]">
                  <TextReveal text="Bình luận gần đây" />
                </h1>
                <p className="mt-5 max-w-2xl text-[15px] leading-7 text-text-secondary sm:text-base">
                  Theo dõi những cuộc trò chuyện mới nhất và tiếp tục đọc từ
                  đúng nơi mọi người đang bàn luận.
                </p>
              </div>

              <div className="flex w-full items-center justify-end gap-3 border-t border-border-default pt-4 md:w-auto md:border-t-0 md:pt-0">
                <span
                  className="hidden h-px w-10 bg-accent/60 md:block"
                  aria-hidden="true"
                />
                <p className="text-sm font-bold text-text-secondary">
                  <span className="text-xl text-text-primary">{total}</span>{" "}
                  bình luận
                </p>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <ScrollReveal delay={0.2}>
          {comments.length === 0 ? (
            <div className="px-5 py-10 sm:px-8 md:px-12">
              <EmptyState
                description="Chưa có bình luận nào được hiển thị."
                title="Không tìm thấy bình luận"
              />
            </div>
          ) : (
            <section aria-label="Danh sách bình luận gần đây">
              <div className="divide-y-2 divide-border-default">
                {comments.map((comment) => (
                  <article
                    className="group grid gap-4 px-5 py-7 transition-colors duration-200 hover:bg-subtle-bg sm:grid-cols-[44px_minmax(0,1fr)] sm:px-8 md:gap-5 md:px-12 md:py-8"
                    key={comment.id}
                  >
                    <div
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent/30 bg-accent/10 text-sm font-extrabold uppercase text-accent transition-colors duration-200 [font-family:var(--font-display)] group-hover:border-accent/60 group-hover:bg-accent/15"
                    >
                      {comment.authorName.trim().charAt(0) || "?"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-5">
                        <span className="font-extrabold text-text-primary">
                          {comment.authorName}
                        </span>
                        <span className="text-text-tertiary">trong</span>
                        <Link
                          className="font-bold text-text-primary decoration-2 underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          href={`/${comment.post.slug}`}
                        >
                          {comment.post.title}
                        </Link>
                        <span className="text-text-tertiary" aria-hidden="true">
                          ·
                        </span>
                        <RelativeTime
                          className="font-medium text-text-tertiary"
                          date={comment.createdAt}
                        />
                      </div>

                      <Link
                        className="relative mt-4 block overflow-hidden rounded-[14px] border-2 border-border-default bg-subtle-bg px-4 py-4 pr-12 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:border-accent/50 hover:bg-background hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5 sm:py-5 sm:pr-14"
                        href={`/${comment.post.slug}#comment-${comment.id}`}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-accent opacity-50 transition-opacity group-hover:opacity-100"
                        />
                        <p className="line-clamp-4 whitespace-pre-wrap break-words text-[15px] font-medium leading-7 text-text-secondary">
                          {comment.content}
                        </p>
                        <svg
                          aria-hidden="true"
                          className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary transition-[color,transform] duration-200 group-hover:translate-x-1 group-hover:text-accent"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M5 12h14m-6-6 6 6-6 6"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                          />
                        </svg>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
              <div className="border-t-2 border-border-default px-5 py-6 sm:px-8 md:px-12">
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
              </div>
            </section>
          )}
        </ScrollReveal>
      </div>
    </PageContainer>
  )
}
