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
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-text-primary group-[.toaster]:border-border-default group-[.toaster]:shadow-lg",
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
