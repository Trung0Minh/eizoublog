"use client"

import { Search } from "lucide-react"

export function CommandMenuTrigger() {
  return (
    <>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("open-command-menu"))}
        className="group hidden lg:flex h-9 w-full items-center gap-2 rounded-full border border-border-default bg-subtle-bg px-3 text-sm text-text-tertiary transition-colors hover:border-accent hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Tìm kiếm...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border-default bg-background px-1.5 font-mono text-[10px] font-medium text-text-tertiary opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("open-command-menu"))}
        className="hidden md:flex lg:hidden h-9 w-9 items-center justify-center rounded-full border border-border-default bg-subtle-bg text-text-secondary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Tìm kiếm bài viết"
        title="Tìm kiếm"
      >
        <Search className="h-4 w-4" />
      </button>
    </>
  )
}
