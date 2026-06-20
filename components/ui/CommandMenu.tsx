"use client"

import { useEffect, useState } from "react"
import { Command } from "cmdk"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

export function CommandMenu() {
  const [open, setOpen] = useState(false)
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] bg-background/80 backdrop-blur-sm transition-all duration-200">
      <div 
        className="fixed inset-0" 
        onClick={() => setOpen(false)} 
      />
      <Command
        className="relative z-50 w-full max-w-[640px] overflow-hidden rounded-xl border border-border-default bg-background shadow-2xl mx-4"
        label="Global Command Menu"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false)
          }
        }}
      >
        <div className="flex items-center border-b border-border-default px-3" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input
            autoFocus
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tìm kiếm..."
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-6 text-center text-sm text-text-secondary">
            Không tìm thấy kết quả.
          </Command.Empty>
          
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
            <Command.Item
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors"
              onSelect={() => {
                setOpen(false)
                router.push("/categories")
              }}
            >
              Danh mục
            </Command.Item>
            <Command.Item
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors"
              onSelect={() => {
                setOpen(false)
                router.push("/dashboard")
              }}
            >
              Dashboard
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
