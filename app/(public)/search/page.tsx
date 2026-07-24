import type { Metadata } from "next"
import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { SearchFilters } from "@/components/search/SearchFilters"
import { SearchPageTracker } from "@/components/search/SearchPageTracker"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { Pagination } from "@/components/ui/Pagination"
import { RelativeTime } from "@/components/ui/RelativeTime"
import { getCachedSearchResults, getCachedSearchTaxonomy } from "@/lib/queries"
import {
  getHighlightedSearchSegments,
  prepareSearchQuery,
  sanitizeSearchSnippet,
  type SearchResult,
} from "@/lib/search"
import { buildMetadata } from "@/lib/seo"

interface SearchPageProps {
  searchParams: Promise<{
    archive?: string
    category?: string
    page?: string
    q?: string
    tag?: string
    tags?: string | string[]
  }>
}

const PAGE_SIZE = 10

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function parseSelectedTags(value: string | string[] | undefined, legacyTag?: string) {
  return Array.from(
    new Set([
      ...(Array.isArray(value) ? value : value ? [value] : []),
      ...(legacyTag ? [legacyTag] : []),
    ]),
  ).filter(Boolean)
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

function EmptySearchState({
  hasCriteria,
  query,
}: {
  hasCriteria: boolean
  query: string
}) {
  return (
    <div className="rounded-[8px] border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">
        {query || hasCriteria
          ? "Không có bài viết nào khớp với tìm kiếm của bạn. Thử ít từ khóa hơn hoặc dùng từ khóa khác."
          : "Nhập từ khóa để tìm kiếm bài viết."}
      </p>
    </div>
  )
}

function HighlightedText({
  className,
  query,
  text,
}: {
  className?: string
  query: string
  text: string
}) {
  const segments = getHighlightedSearchSegments(text, query)

  return (
    <>
      {segments.map((segment, index) =>
        segment.highlight ? (
          <mark className={className} key={`${segment.text}-${index}`}>
            {segment.text}
          </mark>
        ) : (
          segment.text
        ),
      )}
    </>
  )
}

function SearchResultCard({
  query,
  result,
}: {
  query: string
  result: SearchResult
}) {
  const snippet = sanitizeSearchSnippet(result.snippet)
  const fallbackSnippet = result.excerpt?.trim()

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
            className="text-lg font-semibold leading-snug tracking-tight transition-colors hover:text-accent"
            href={`/${result.slug}`}
          >
            <HighlightedText
              className="rounded px-0.5 text-text-primary ring-1 ring-accent/20 [background-color:color-mix(in_srgb,var(--accent)_22%,transparent)]"
              query={query}
              text={result.title}
            />
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.authorName} · <RelativeTime date={result.publishedAt} />
          </p>
          {snippet ? (
            <p
              className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground [&_mark]:rounded [&_mark]:px-0.5 [&_mark]:text-text-primary [&_mark]:ring-1 [&_mark]:ring-accent/20 [&_mark]:[background-color:color-mix(in_srgb,var(--accent)_22%,transparent)]"
              dangerouslySetInnerHTML={{ __html: snippet }}
            />
          ) : fallbackSnippet ? (
            <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              <HighlightedText
                className="rounded px-0.5 text-text-primary ring-1 ring-accent/20 [background-color:color-mix(in_srgb,var(--accent)_22%,transparent)]"
                query={query}
                text={fallbackSnippet}
              />
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [{ archive, page: pageParam, q, category, tag, tags: tagsParam }, taxonomy] = await Promise.all([
    searchParams,
    getCachedSearchTaxonomy(),
  ])
  const { archives, categories, tags } = taxonomy

  const query = (q ?? "").trim()
  const page = parsePage(pageParam)
  const searchQuery = prepareSearchQuery(query)
  const selectedTags = parseSelectedTags(tagsParam, tag)
  const hasFilters = Boolean(category || archive || selectedTags.length > 0)

  let results: SearchResult[] = []
  let total = 0

  if (searchQuery.normalizedQuery || hasFilters) {
    const searchData = await getCachedSearchResults(
      searchQuery,
      page,
      PAGE_SIZE,
      {
        archive,
        categorySlug: category,
        tagSlugs: selectedTags,
      },
    )
    results = searchData.results
    total = searchData.total
  }

  return (
    <PageContainer className="py-10">
      {query && <SearchPageTracker query={query} />}
      
      <ScrollReveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Tìm kiếm kho lưu trữ
        </p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight">
          <TextReveal text={query ? `Kết quả cho "${query}"` : "Tìm kiếm"} />
        </h1>
        {(query || hasFilters) && (
          <p className="mt-2 text-sm text-muted-foreground">
            Tìm thấy {total} kết quả
          </p>
        )}
      </ScrollReveal>

      <ScrollReveal className="relative z-20" delay={0.1}>
        <SearchFilters
          archives={archives}
          categories={categories}
          initialArchive={archive}
          initialCategory={category}
          initialQuery={query}
          initialTags={selectedTags}
          tags={tags}
        />
      </ScrollReveal>

      {query || hasFilters ? (
        <ScrollReveal className="relative z-0" delay={0.2}>
          <div className="rounded-[16px] border-[2px] border-border-default bg-background/90 p-4 shadow-sm backdrop-blur-md sm:p-6">
          {results.length === 0 ? (
            <EmptySearchState hasCriteria={hasFilters} query={query} />
          ) : (
            <div>
              {results.map((result) => (
                <SearchResultCard key={result.id} query={query} result={result} />
              ))}
            </div>
          )}
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            query={{ archive, category, q: query, tags: selectedTags }}
            total={total}
          />
        </ScrollReveal>
      ) : (
        <ScrollReveal delay={0.2}>
          <EmptySearchState hasCriteria={false} query={query} />
        </ScrollReveal>
      )}
    </PageContainer>
  )
}
