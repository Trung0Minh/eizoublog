"use client"

import Link from "next/link"
import { Check, ChevronDown, Search, X } from "lucide-react"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"

interface FilterOption {
  count: number
  name: string
  slug: string
}

interface ArchiveOption {
  count: number
  month: string
}

interface SearchFiltersProps {
  archives: ArchiveOption[]
  categories: FilterOption[]
  initialArchive?: string
  initialCategory?: string
  initialQuery: string
  initialTags: string[]
  tags: FilterOption[]
}

function formatArchiveLabel(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month
  }

  const [year, monthNumber] = month.split("-")
  return `${monthNumber}/${year}`
}

function optionMatches(option: { name: string; slug: string }, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return (
    option.name.toLowerCase().includes(normalizedQuery) ||
    option.slug.toLowerCase().includes(normalizedQuery)
  )
}

function FilterPopover({
  children,
  label,
  value,
}: {
  children: ReactNode
  label: string
  value: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-[12px] border-[2px] border-border-default bg-background px-4 text-left text-[14px] font-medium text-text-primary outline-none transition-colors hover:border-accent/70 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="min-w-0 truncate">{value}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-tertiary transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-hidden rounded-[12px] border-[2px] border-border-default bg-background shadow-xl">
          <div className="border-b border-border-default px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
            {label}
          </div>
          {children}
        </div>
      )}
    </div>
  )
}

export function SearchFilters({
  archives,
  categories,
  initialArchive,
  initialCategory,
  initialQuery,
  initialTags,
  tags,
}: SearchFiltersProps) {
  const [categoryQuery, setCategoryQuery] = useState("")
  const [selectedArchive, setSelectedArchive] = useState(initialArchive ?? "")
  const [selectedCategory, setSelectedCategory] = useState(initialCategory ?? "")
  const [selectedTags, setSelectedTags] = useState(initialTags)
  const [tagQuery, setTagQuery] = useState("")

  const selectedCategoryOption = categories.find(
    (category) => category.slug === selectedCategory,
  )
  const selectedArchiveOption = archives.find(
    (archive) => archive.month === selectedArchive,
  )
  const selectedTagOptions = tags.filter((tag) => selectedTags.includes(tag.slug))
  const hasActiveFilters =
    Boolean(initialQuery.trim()) ||
    Boolean(selectedCategory) ||
    Boolean(selectedArchive) ||
    selectedTags.length > 0

  const filteredCategories = useMemo(
    () => categories.filter((category) => optionMatches(category, categoryQuery)),
    [categories, categoryQuery],
  )
  const filteredTags = useMemo(
    () => tags.filter((tag) => optionMatches(tag, tagQuery)),
    [tags, tagQuery],
  )

  function toggleTag(slug: string) {
    setSelectedTags((current) =>
      current.includes(slug)
        ? current.filter((selectedSlug) => selectedSlug !== slug)
        : [...current, slug],
    )
  }

  return (
    <div className="mb-10 mt-8 rounded-[16px] border-[2px] border-border-default bg-background/90 p-4 shadow-sm backdrop-blur-md sm:p-6">
      <form action="/search" className="space-y-5" method="GET">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.7fr)_minmax(220px,0.9fr)_minmax(170px,0.65fr)]">
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wider text-text-tertiary"
              htmlFor="search-q"
            >
              Từ khóa tìm kiếm
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                className="h-11 w-full rounded-[12px] border-[2px] border-border-default bg-background pl-10 pr-4 text-[14px] outline-none transition-colors placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20"
                defaultValue={initialQuery}
                id="search-q"
                name="q"
                placeholder="Nhập từ khóa tìm kiếm..."
                type="search"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Danh mục
            </label>
            {selectedCategory && <input name="category" type="hidden" value={selectedCategory} />}
            <FilterPopover
              label="Chọn danh mục"
              value={
                selectedCategoryOption
                  ? `${selectedCategoryOption.name} (${selectedCategoryOption.count})`
                  : "Tất cả danh mục"
              }
            >
              <div className="p-2">
                <input
                  aria-label="Tìm danh mục"
                  className="mb-2 h-9 w-full rounded-[8px] border border-border-default bg-background px-3 text-sm outline-none focus:border-accent"
                  onChange={(event) => setCategoryQuery(event.target.value)}
                  placeholder="Lọc danh mục..."
                  type="search"
                  value={categoryQuery}
                />
                <div className="max-h-48 overflow-y-auto">
                  <button
                    className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-subtle-bg"
                    onClick={() => setSelectedCategory("")}
                    type="button"
                  >
                    Tất cả danh mục
                    {!selectedCategory && <Check className="h-4 w-4 text-accent" />}
                  </button>
                  {filteredCategories.map((category) => (
                    <button
                      className="flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-subtle-bg"
                      key={category.slug}
                      onClick={() => setSelectedCategory(category.slug)}
                      type="button"
                    >
                      <span className="min-w-0 truncate">
                        {category.name}{" "}
                        <span className="text-text-tertiary">({category.count})</span>
                      </span>
                      {selectedCategory === category.slug && (
                        <Check className="h-4 w-4 shrink-0 text-accent" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </FilterPopover>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Thẻ
            </label>
            {selectedTags.map((slug) => (
              <input key={slug} name="tags" type="hidden" value={slug} />
            ))}
            <FilterPopover
              label="Chọn nhiều thẻ"
              value={
                selectedTagOptions.length > 0
                  ? `${selectedTagOptions.length} thẻ đã chọn`
                  : "Tất cả thẻ"
              }
            >
              <div className="p-2">
                <input
                  aria-label="Tìm thẻ"
                  className="mb-2 h-9 w-full rounded-[8px] border border-border-default bg-background px-3 text-sm outline-none focus:border-accent"
                  onChange={(event) => setTagQuery(event.target.value)}
                  placeholder="Lọc thẻ..."
                  type="search"
                  value={tagQuery}
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredTags.map((tag) => (
                    <button
                      className="flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-subtle-bg"
                      key={tag.slug}
                      onClick={() => toggleTag(tag.slug)}
                      type="button"
                    >
                      <span className="min-w-0 truncate">
                        #{tag.name}{" "}
                        <span className="text-text-tertiary">({tag.count})</span>
                      </span>
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          selectedTags.includes(tag.slug)
                            ? "border-accent bg-accent text-white"
                            : "border-border-default",
                        )}
                      >
                        {selectedTags.includes(tag.slug) && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </FilterPopover>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Tháng lưu trữ
            </label>
            {selectedArchive && <input name="archive" type="hidden" value={selectedArchive} />}
            <FilterPopover
              label="Chọn tháng"
              value={
                selectedArchiveOption
                  ? `${formatArchiveLabel(selectedArchiveOption.month)} (${selectedArchiveOption.count})`
                  : "Tất cả tháng"
              }
            >
              <div className="max-h-56 overflow-y-auto p-2">
                <button
                  className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-subtle-bg"
                  onClick={() => setSelectedArchive("")}
                  type="button"
                >
                  Tất cả tháng
                  {!selectedArchive && <Check className="h-4 w-4 text-accent" />}
                </button>
                {archives.map((archive) => (
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-subtle-bg"
                    key={archive.month}
                    onClick={() => setSelectedArchive(archive.month)}
                    type="button"
                  >
                    <span>
                      {formatArchiveLabel(archive.month)}{" "}
                      <span className="text-text-tertiary">({archive.count})</span>
                    </span>
                    {selectedArchive === archive.month && (
                      <Check className="h-4 w-4 shrink-0 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </FilterPopover>
          </div>
        </div>

        {selectedTagOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTagOptions.map((tag) => (
              <button
                className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/15"
                key={tag.slug}
                onClick={() => toggleTag(tag.slug)}
                type="button"
              >
                #{tag.name}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {hasActiveFilters ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
              href="/search"
            >
              Xóa bộ lọc
            </Link>
          ) : (
            <span className="text-sm text-text-tertiary">
              Dùng bộ lọc để tìm theo danh mục, thẻ hoặc tháng xuất bản.
            </span>
          )}
          <button
            className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-6 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-accent/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            type="submit"
          >
            Tìm kiếm
          </button>
        </div>
      </form>
    </div>
  )
}
