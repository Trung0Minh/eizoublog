"use client"

import { Settings } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"
import { ParticleToggle } from "@/components/ui/ParticleToggle"

export function MobileSettings() {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    window.dispatchEvent(
      new CustomEvent("navbar-menu:open-change", { detail: nextOpen }),
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-text-secondary hover:bg-subtle-bg hover:text-accent md:hidden"
          aria-label="Cài đặt giao diện"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-auto min-w-0 p-1.5 flex flex-col items-center gap-1 bg-background/95 backdrop-blur-xl border-border-default rounded-[12px] duration-200 data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-90 [&_svg]:pointer-events-none"
        onInteractOutside={(event) => {
          if (document.documentElement.dataset.themeTransitioning === "true") {
            event.preventDefault()
          }
        }}
      >
        <ThemeToggle />
        <SeasonToggle />
        <ParticleToggle />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
