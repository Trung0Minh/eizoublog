"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useDebounce } from "@/hooks/useDebounce"

export function AdminPostSearch() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") ?? ""

  return <AdminPostSearchInput initialQuery={initialQuery} key={initialQuery} />
}

function AdminPostSearchInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(initialQuery)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery === (searchParams.get("q") ?? "")) return

    const params = new URLSearchParams(searchParams)
    if (debouncedQuery) {
      params.set("q", debouncedQuery)
    } else {
      params.delete("q")
    }
    params.delete("page") // Reset to page 1 on search

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [debouncedQuery, pathname, router, searchParams])

  return (
    <div className="relative w-full md:w-[260px]">
      <Search
        aria-hidden="true"
        className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
          isPending ? "text-accent animate-pulse" : "text-text-tertiary"
        }`}
      />
      <input
        className="h-10 w-full rounded-full border border-border-default/50 bg-background/40 pl-10 pr-4 text-[13px] font-medium outline-none transition-all placeholder:text-text-tertiary focus:border-accent focus:bg-background focus:ring-1 focus:ring-accent/20"
        placeholder="Search posts..."
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  )
}
