"use client"

import { useEffect, useState } from "react"
import { Command } from "cmdk"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface SearchPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
}

interface SearchCategory {
  id: string
  name: string
  slug: string
}

interface SearchResponse {
  data?: {
    results?: SearchPost[]
  }
}

const MAX_VISIBLE_CATEGORIES = 8

let categoryCache: SearchCategory[] | null = null
let categoryRequest: Promise<SearchCategory[]> | null = null

async function loadCategories() {
  if (categoryCache) {
    return categoryCache
  }

  categoryRequest ??= fetch("/api/categories")
    .then((res) => res.json())
    .then((res: { data?: SearchCategory[] }) => {
      categoryCache = res.data ?? []
      return categoryCache
    })
    .finally(() => {
      categoryRequest = null
    })

  return categoryRequest
}

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchPost[]>([])
  const [categories, setCategories] = useState<SearchCategory[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery)

    if (!nextQuery.trim()) {
      setResults([])
      setLoading(false)
    }
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    document.addEventListener("open-command-menu", handleOpen)
    return () => document.removeEventListener("open-command-menu", handleOpen)
  }, [])

  useEffect(() => {
    if (!open || categories.length > 0) {
      return
    }

    let cancelled = false

    loadCategories()
      .then((nextCategories) => {
        if (!cancelled) {
          setCategories(nextCategories)
        }
      })
      .catch((err) => console.error("Failed to load categories in CommandMenu", err))

    return () => {
      cancelled = true
    }
  }, [categories.length, open])

  // Fetch dynamic search results when query changes
  useEffect(() => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      return
    }

    const controller = new AbortController()
    const debounceTimer = setTimeout(() => {
      setLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}&limit=6`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((res: SearchResponse) => {
          if (res.data?.results) {
            setResults(res.data.results)
          } else {
            setResults([])
          }
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") {
            return
          }
          console.error("Search failed in CommandMenu", err)
          setResults([])
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false)
          }
        })
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(debounceTimer)
    }
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] bg-black/40 dark:bg-black/60 backdrop-blur-md transition-all duration-300">
      <div 
        className="fixed inset-0" 
        onClick={() => {
          setOpen(false)
          setQuery("")
        }}
      />
      <Command
        shouldFilter={false}
        className="relative z-50 w-full max-w-[640px] overflow-hidden rounded-[20px] border-[1.5px] border-border-default bg-background/95 text-text-primary shadow-[0_0_40px_rgba(0,0,0,0.22)] backdrop-blur-xl mx-4"
        label="Global Command Menu"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false)
            setQuery("")
          }
        }}
      >
        <div className="flex items-center border-b border-border-default bg-background/80 px-3" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 text-text-secondary" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={handleQueryChange}
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tìm kiếm bài viết hoặc danh mục..."
          />
        </div>
        <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto overflow-x-hidden p-2">
          {loading && (
            <div className="py-6 text-center text-sm text-text-tertiary">
              Đang tìm kiếm...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <Command.Empty className="py-6 text-center text-sm text-text-secondary">
              Không tìm thấy bài viết nào.
            </Command.Empty>
          )}
          
          {!query && (
            <>
              <Command.Group>
                <Command.Item
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm text-text-primary outline-none data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors"
                  onSelect={() => {
                    setOpen(false)
                    setQuery("")
                    router.push("/search")
                  }}
                >
                  Tìm kiếm nâng cao
                </Command.Item>
              </Command.Group>

              {categories.length > 0 && (
                <Command.Group heading="Danh mục" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-text-secondary mt-2">
                  {categories.slice(0, MAX_VISIBLE_CATEGORIES).map((category) => (
                    <Command.Item
                      key={category.id}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm text-text-primary outline-none data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors"
                      onSelect={() => {
                        setOpen(false)
                        router.push(`/category/${category.slug}`)
                      }}
                    >
                      {category.name}
                    </Command.Item>
                  ))}
                  {categories.length > MAX_VISIBLE_CATEGORIES && (
                    <Command.Item
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm text-text-secondary outline-none data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent transition-colors"
                      onSelect={() => {
                        setOpen(false)
                        setQuery("")
                        router.push("/search")
                      }}
                    >
                      Xem thêm trong tìm kiếm nâng cao
                    </Command.Item>
                  )}
                </Command.Group>
              )}
            </>
          )}

          {query && results.length > 0 && (
            <Command.Group heading="Bài viết" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-text-secondary">
              {results.map((post) => (
                <Command.Item
                  key={post.id}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm text-text-primary outline-none data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors"
                  onSelect={() => {
                    setOpen(false)
                    setQuery("")
                    router.push(`/${post.slug}`)
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-text-primary">{post.title}</span>
                    {post.excerpt && (
                      <span className="text-xs text-text-tertiary line-clamp-1">{post.excerpt}</span>
                    )}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  )
}
