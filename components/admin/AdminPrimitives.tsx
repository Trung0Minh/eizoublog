import type { LucideIcon } from "lucide-react"
import type React from "react"

import { cn } from "@/lib/utils"
import { TextReveal } from "@/components/ui/TextReveal"

interface AdminPageHeaderProps {
  action?: React.ReactNode
  subtitle?: React.ReactNode
  title: string
}

export function AdminPageHeader({
  action,
  subtitle,
  title,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
      <div>
        <h1 className="font-display text-[24px] font-bold leading-tight text-text-primary">
          <TextReveal text={title} />
        </h1>
        {subtitle && (
          <p className="mt-1 text-[14px] text-text-secondary">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

interface AdminMetricCardProps {
  className?: string
  icon: LucideIcon
  label: string
  trend?: string
  trendTone?: "negative" | "neutral" | "positive"
  value: string
}

export function AdminMetricCard({
  className,
  icon: Icon,
  label,
  trend,
  trendTone = "positive",
  value,
}: AdminMetricCardProps) {
  return (
    <div
      className={cn(
        "group relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-border-default/40 bg-background/30 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-3xl transition-all duration-300 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.04)] hover:border-border-default/60 md:p-6",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
        <span className="truncate pr-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-text-secondary">
          {label}
        </span>
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 shadow-sm border border-transparent",
          trendTone === "positive" ? "bg-[#15803d]/10 text-[#15803d] border-[#15803d]/20 dark:bg-[#4ade80]/10 dark:text-[#4ade80] dark:border-[#4ade80]/20" :
          trendTone === "negative" ? "bg-accent/10 text-accent border-accent/20" :
          "bg-subtle-bg text-text-tertiary border-border-default/50"
        )}>
          <Icon aria-hidden="true" className="h-4 w-4" />
        </div>
      </div>
      <div className="relative z-10 flex flex-col justify-end min-h-[56px]">
        <div className="font-display text-[28px] font-bold leading-none text-text-primary tracking-tight md:text-[34px]">
          {value}
        </div>
        <div className="h-5 mt-1.5 flex items-center">
          {trend ? (
            <div
              className={cn(
                "truncate text-[12px] font-semibold transition-colors",
                trendTone === "positive" && "text-[#15803d] dark:text-[#4ade80]",
                trendTone === "negative" && "text-accent",
                trendTone === "neutral" && "text-text-tertiary",
              )}
            >
              {trend}
            </div>
          ) : (
             <div className="w-full h-full" />
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminStatusBadge({
  status,
}: {
  status: "Archived" | "Draft" | "Published"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm border",
        status === "Published" &&
          "border-[#15803d]/20 bg-[#f0fdf4]/50 text-[#15803d] dark:border-[#4ade80]/20 dark:bg-[#14532d]/40 dark:text-[#4ade80]",
        status === "Draft" &&
          "border-border-default/50 bg-subtle-bg/50 text-text-secondary",
        status === "Archived" &&
          "border-[#c2410c]/20 bg-[#fff7ed]/50 text-[#c2410c] dark:border-[#fb923c]/20 dark:bg-[#7c2d12]/40 dark:text-[#fb923c]",
      )}
    >
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        status === "Published" && "bg-[#15803d] dark:bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.6)]",
        status === "Draft" && "bg-text-tertiary",
        status === "Archived" && "bg-[#c2410c] dark:bg-[#fb923c] shadow-[0_0_8px_rgba(251,146,60,0.6)]"
      )} />
      {status}
    </span>
  )
}

interface AdminConfirmModalProps {
  body: React.ReactNode
  confirmLabel: string
  icon: React.ReactNode
  onCancel: () => void
  onConfirm: () => void
  title: string
  tone?: "archive" | "delete"
}

export function AdminConfirmModal({
  body,
  confirmLabel,
  icon,
  onCancel,
  onConfirm,
  title,
  tone = "delete",
}: AdminConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close confirmation"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        type="button"
      />
      <div className="relative w-full max-w-[400px] rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-md">
        <div
          className={cn(
            "mb-4 flex h-12 w-12 items-center justify-center rounded-full",
            tone === "delete"
              ? "bg-[#fef2f2] dark:bg-[#3f0f0f40]"
              : "bg-orange-50 dark:bg-[#7c2d1230]",
          )}
        >
          {icon}
        </div>
        <h2 className="mb-2 text-[17px] font-bold text-text-primary">
          {title}
        </h2>
        <p className="text-[13px] leading-[1.6] text-text-secondary">{body}</p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            className="h-9 rounded-full border-[2px] border-border-default px-5 text-[13px] font-medium text-text-primary transition-colors hover:bg-subtle-bg"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={cn(
              "h-9 rounded-full px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90",
              tone === "delete" ? "bg-[#c0392b] dark:bg-[#e05c4a]" : "bg-accent",
            )}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
