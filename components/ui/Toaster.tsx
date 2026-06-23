"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      richColors
      theme="system"
      expand={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-subtle-bg group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-text-primary group-[.toaster]:border-[1.5px] group-[.toaster]:border-white/20 group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.15)] group-[.toaster]:rounded-[16px]",
          description: "group-[.toast]:text-text-secondary",
          actionButton:
            "group-[.toast]:bg-accent group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-subtle-bg group-[.toast]:text-text-secondary",
        },
      }}
    />
  )
}
