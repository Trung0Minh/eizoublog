import type { Metadata } from "next"
import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { SearchPageTracker } from "@/components/search/SearchPageTracker"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { Pagination } from "@/components/ui/Pagination"
import { RelativeTime } from "@/components/ui/RelativeTime"
import { getCachedSearchResults } from "@/lib/queries"
import {
  buildSearchQuery,
  sanitizeSearchSnippet,
  type SearchResult,
} from "@/lib/search"
import { buildMetadata } from "@/lib/seo"
import { prisma } from "@/lib/prisma"

interface SearchPageProps {
  searchParams: Promise<{ page?: string; q?: string; category?: string; tag?: string }>
}

const PAGE_SIZE = 10

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  const query = (q ?? "").trim()

  return buildMetadata({
    canonicalPath: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
    noIndex: true,
    title: query ? `Tìm kiếm: ${query}` : "Tìm kiếm",
  })
}

function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="rounded-[8px] border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">
        {query
          ? "Không có bài viết nào khớp với tìm kiếm của bạn. Thử ít từ khóa hơn hoặc dùng từ khóa khác."
          : "Nhập từ khóa để tìm kiếm bài viết."}
      </p>
    </div>
  )
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const snippet = sanitizeSearchSnippet(result.snippet)

  return (
    <article className="border-t py-5 first:border-t-0">
      <div className="flex gap-4">
        {result.coverUrl && (
          <img
            alt=""
            className="hidden h-24 w-32 shrink-0 rounded-[6px] object-cover sm:block"
            decoding="async"
            loading="lazy"
            src={result.coverUrl}
          />
        )}
        <div className="min-w-0 flex-1">
          <Link
            className="text-lg font-semibold leading-snug tracking-tight transition-colors hover:text-editorial"
            href={`/${result.slug}`}
          >
            {result.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.authorName} · <RelativeTime date={result.publishedAt} />
          </p>
          {snippet && (
            <p
              className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground [&_mark]:rounded [&_mark]:bg-editorial/20 [&_mark]:px-0.5 [&_mark]:text-foreground"
              dangerouslySetInnerHTML={{ __html: snippet }}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [{ page: pageParam, q, category, tag }, categories, tags] = await Promise.all([
    searchParams,
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
  ])

  const query = (q ?? "").trim()
  const page = parsePage(pageParam)
  const tsQuery = buildSearchQuery(query)

  let results: SearchResult[] = []
  let total = 0

  if (query && tsQuery) {
    const searchData = await getCachedSearchResults(
      tsQuery,
      page,
      PAGE_SIZE,
      category,
      tag,
    )
    results = searchData.results
    total = searchData.total
  }

  return (
    <PageContainer className="py-10">
      {query && <SearchPageTracker query={query} />}
      
      <ScrollReveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-editorial">
          Tìm kiếm kho lưu trữ
        </p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight">
          <TextReveal text={query ? `Kết quả cho "${query}"` : "Tìm kiếm"} />
        </h1>
        {query && (
          <p className="mt-2 text-sm text-muted-foreground">
            Tìm thấy {total} kết quả
          </p>
        )}
      </ScrollReveal>

      {/* Beautiful Search Form with Category & Tag Filters */}
      <ScrollReveal delay={0.1}>
        <div className="mt-8 mb-10 rounded-[24px] border-[2px] border-border-default bg-background/80 backdrop-blur-md p-6 sm:p-8 shadow-sm">
          <form action="/search" method="GET" className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary" htmlFor="search-q">
                Từ khóa tìm kiếm
              </label>
              <input
                id="search-q"
                name="q"
                type="text"
                defaultValue={query}
                placeholder="Nhập từ khóa tìm kiếm..."
                className="w-full h-10 rounded-[12px] border-[2px] border-border-default bg-background px-4 text-[14px] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>

            <div className="w-full md:w-[200px] space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary" htmlFor="search-category">
                Danh mục
              </label>
              <select
                id="search-category"
                name="category"
                defaultValue={category ?? ""}
                className="w-full h-10 rounded-[12px] border-[2px] border-border-default bg-background px-3 text-[14px] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all cursor-pointer"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-[200px] space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary" htmlFor="search-tag">
                Thẻ
              </label>
              <select
                id="search-tag"
                name="tag"
                defaultValue={tag ?? ""}
                className="w-full h-10 rounded-[12px] border-[2px] border-border-default bg-background px-3 text-[14px] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all cursor-pointer"
              >
                <option value="">Tất cả thẻ</option>
                {tags.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="h-10 rounded-full bg-accent hover:bg-accent/95 px-6 font-display font-bold text-white text-[14px] tracking-wide shadow-sm hover:shadow-md transition-all flex items-center justify-center shrink-0"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </ScrollReveal>

      {query ? (
        <ScrollReveal delay={0.2}>
          <div>
          {results.length === 0 ? (
            <EmptySearchState query={query} />
          ) : (
            <div>
              {results.map((result) => (
                <SearchResultCard key={result.id} result={result} />
              ))}
            </div>
          )}
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            query={{ q: query, category, tag }}
            total={total}
          />
        </ScrollReveal>
      ) : (
        <ScrollReveal delay={0.2}>
          <EmptySearchState query={query} />
        </ScrollReveal>
      )}
    </PageContainer>
  )
}
