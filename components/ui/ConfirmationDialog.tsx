"use client"

import * as Dialog from "@radix-ui/react-dialog"
import type { LucideIcon } from "lucide-react"
import { AlertTriangle, Loader2, X } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ConfirmationTone = "default" | "destructive" | "warning"

interface ConfirmationDialogProps {
  cancelLabel?: string
  confirmLabel: string
  confirmationText?: string
  description: ReactNode
  icon?: LucideIcon
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  pending?: boolean
  title: string
  tone?: ConfirmationTone
}

const toneClasses: Record<ConfirmationTone, string> = {
  default: "border-accent/25 bg-accent/10 text-accent",
  destructive: "border-destructive/25 bg-destructive/10 text-destructive",
  warning:
    "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
}

export function ConfirmationDialog({
  cancelLabel = "Cancel",
  confirmLabel,
  confirmationText,
  description,
  icon: Icon = AlertTriangle,
  onConfirm,
  onOpenChange,
  open,
  pending = false,
  title,
  tone = "default",
}: ConfirmationDialogProps) {
  const [confirmation, setConfirmation] = useState("")

  const confirmationMatches =
    !confirmationText || confirmation === confirmationText

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setConfirmation("")
    onOpenChange(nextOpen)
  }

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[121] w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-border-default/70 bg-background/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-7">
          <Dialog.Close
            aria-label="Close dialog"
            className="absolute right-4 top-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            disabled={pending}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Dialog.Close>

          <div
            className={cn(
              "mb-5 flex h-11 w-11 items-center justify-center rounded-full border",
              toneClasses[tone],
            )}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
          </div>

          <Dialog.Title className="pr-9 font-display text-[20px] font-bold leading-tight text-text-primary">
            {title}
          </Dialog.Title>
          <Dialog.Description asChild>
            <div className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              {description}
            </div>
          </Dialog.Description>

          {confirmationText && (
            <div className="mt-5 space-y-2">
              <label className="text-xs font-semibold text-text-secondary" htmlFor="confirmation-text">
                Type <span className="font-mono text-text-primary">{confirmationText}</span> to confirm
              </label>
              <Input
                autoComplete="off"
                id="confirmation-text"
                onChange={(event) => setConfirmation(event.target.value)}
                value={confirmation}
              />
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button disabled={pending} type="button" variant="outline">
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              className={cn(
                tone === "warning" &&
                  "bg-orange-600 text-white hover:bg-orange-600/90 dark:bg-orange-500",
              )}
              disabled={pending || !confirmationMatches}
              onClick={onConfirm}
              type="button"
              variant={tone === "destructive" ? "destructive" : "default"}
            >
              {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
