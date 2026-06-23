"use client"

import { Settings } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { BackgroundSettings } from "@/components/admin/BackgroundSettings"

export function AdminBackgroundFlyout() {
  return (
    <div className="fixed top-1/2 right-0 -translate-y-1/2 z-50 group">
      <Sheet>
        <SheetTrigger asChild>
          <button 
            className="flex items-center justify-center w-12 h-14 bg-background/60 backdrop-blur-md border border-r-0 border-border-default rounded-l-xl text-text-secondary hover:text-accent hover:w-14 transition-all duration-300 shadow-lg group-hover:translate-x-0 translate-x-8"
            aria-label="Cài đặt Ảnh nền"
          >
            <Settings className="w-5 h-5 animate-[spin_4s_linear_infinite] group-hover:animate-none" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[85vw] sm:w-[540px] overflow-y-auto border-l-border-default bg-background/95 backdrop-blur-xl">
          <SheetTitle className="sr-only">Cài đặt ảnh nền</SheetTitle>
          <SheetDescription className="sr-only">Cài đặt ảnh nền cho các mùa và giao diện</SheetDescription>
          <div className="mt-6">
            <BackgroundSettings />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
