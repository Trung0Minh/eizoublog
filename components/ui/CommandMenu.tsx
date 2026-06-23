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
    if (!query.trim()) {
      return
    }

    const debounceTimer = setTimeout(() => {
      setLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.data?.results) {
            setResults(res.data.results)
          } else {
            setResults([])
          }
        })
        .catch((err) => {
          console.error("Search failed in CommandMenu", err)
          setResults([])
        })
        .finally(() => {
          setLoading(false)
        })
    }, 250)

    return () => clearTimeout(debounceTimer)
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
        className="relative z-50 w-full max-w-[640px] overflow-hidden rounded-[20px] border-[1.5px] border-white/20 dark:border-white/10 bg-subtle-bg backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)] mx-4"
        label="Global Command Menu"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false)
            setQuery("")
          }
        }}
      >
        <div className="flex items-center border-b border-border-default px-3" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tìm kiếm bài viết hoặc danh mục..."
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
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
              <Command.Group heading="Điều hướng" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary">
                <Command.Item
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors"
                  onSelect={() => {
                    setOpen(false)
                    router.push("/")
                  }}
                >
                  Trang chủ
                </Command.Item>
              </Command.Group>

              {categories.length > 0 && (
                <Command.Group heading="Danh mục" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary mt-2">
                  {categories.map((category) => (
                    <Command.Item
                      key={category.id}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors"
                      onSelect={() => {
                        setOpen(false)
                        router.push(`/category/${category.slug}`)
                      }}
                    >
                      {category.name}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </>
          )}

          {query && results.length > 0 && (
            <Command.Group heading="Bài viết" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary">
              {results.map((post) => (
                <Command.Item
                  key={post.id}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors"
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
