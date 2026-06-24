"use client"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"
import { ParticleToggle } from "@/components/ui/ParticleToggle"

export function MobileSettings() {
  return (
    <DropdownMenu>
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
      <DropdownMenuContent align="end" className="w-auto min-w-0 p-1.5 flex flex-col items-center gap-1 bg-background/95 backdrop-blur-xl border-border-default rounded-[12px]">
        <ThemeToggle />
        <SeasonToggle />
        <ParticleToggle />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
