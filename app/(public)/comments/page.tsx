import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, ArrowUpRight, MessageCircle } from "lucide-react"

import { PageContainer } from "@/components/layout/PageContainer"
import { EmptyState } from "@/components/ui/EmptyState"
import { Pagination } from "@/components/ui/Pagination"
import { RelativeTime } from "@/components/ui/RelativeTime"
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
    <PageContainer className="max-w-[960px] py-6 md:py-10 xl:max-w-[960px]">
      <div className="overflow-hidden rounded-[20px] border border-border-default bg-background/90 shadow-sm backdrop-blur-xl" data-mobile-surface="true">
        <header className="px-5 pb-7 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
          <Link
            className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-text-secondary transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Trang chủ
          </Link>
          <div className="flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border-default bg-subtle-bg text-accent sm:flex">
              <MessageCircle aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-text-primary sm:text-4xl">
                Bình luận gần đây
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary sm:text-[15px]">
                Những cuộc trò chuyện mới nhất, từ bài viết đến góc nhìn của bạn.
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border-default bg-subtle-bg px-5 py-3 text-xs font-semibold text-text-secondary sm:px-8">
          <span className="flex items-center gap-2">
            <MessageCircle aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
            <span><span className="tabular-nums text-text-primary">{total}</span> bình luận</span>
          </span>
          <span>Mới nhất trước</span>
        </div>

          {comments.length === 0 ? (
            <div className="px-5 py-10 sm:px-8 md:px-12">
              <EmptyState
                description="Chưa có bình luận nào được hiển thị."
                title="Không tìm thấy bình luận"
              />
            </div>
          ) : (
            <section aria-label="Danh sách bình luận gần đây">
              <div className="divide-y divide-border-default">
                {comments.map((comment) => (
                  <article
                    className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 gap-y-2 px-5 py-6 transition-colors duration-200 hover:bg-subtle-bg sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-x-4 sm:px-8 sm:py-7"
                    data-testid={`recent-comment-${comment.id}`}
                    key={comment.id}
                  >
                    <div
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default bg-subtle-bg font-display text-sm font-bold uppercase text-accent sm:h-10 sm:w-10"
                    >
                      {comment.authorName.trim().charAt(0) || "?"}
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm leading-5">
                      <span className="break-words font-bold text-text-primary [overflow-wrap:anywhere]">
                        {comment.authorName}
                      </span>
                      <RelativeTime
                        className="shrink-0 text-xs text-text-secondary"
                        date={comment.createdAt}
                      />
                    </div>

                    <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2">
                      <Link
                        className="block rounded-sm py-1 text-text-primary transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                        href={`/${comment.post.slug}#comment-${comment.id}`}
                      >
                        <p className="line-clamp-4 whitespace-pre-wrap break-words text-[15px] leading-7 [overflow-wrap:anywhere] sm:text-base">
                          {comment.content}
                        </p>
                      </Link>
                      <Link
                        className="mt-2 flex min-h-11 items-center gap-2 rounded-sm text-xs leading-5 text-text-secondary transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:text-[13px]"
                        href={`/${comment.post.slug}`}
                      >
                        <MessageCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-accent" />
                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                          <span className="mr-1 font-normal">Trong bài</span>{" "}
                          <span className="font-semibold">{comment.post.title}</span>
                        </span>
                        <ArrowUpRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
              {total > PAGE_SIZE && (
                <div className="border-t border-border-default px-3 py-5 sm:px-8">
                  <Pagination className="mt-0 flex-wrap md:mt-0" page={page} pageSize={PAGE_SIZE} total={total} />
                </div>
              )}
            </section>
          )}
      </div>
    </PageContainer>
  )
}
