"use client"

import type { ReactNode } from "react"
import { useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

const subscribe = () => () => undefined

export function AdminEventPreviewShell({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-background"
      data-testid="admin-event-preview-shell"
    >
      {children}
    </div>,
    document.body,
  )
}
