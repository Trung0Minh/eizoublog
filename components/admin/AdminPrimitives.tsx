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
        "flex min-w-0 flex-1 flex-col justify-between rounded-[18px] border border-border-default/70 bg-background/50 p-4 shadow-sm backdrop-blur-md md:p-6",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="truncate pr-2 text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
          {label}
        </span>
        <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
      </div>
      <div>
        <div className="text-[24px] font-bold leading-tight text-text-primary md:text-[28px]">
          {value}
        </div>
        {trend && (
          <div
            className={cn(
              "mt-1 truncate text-[11px]",
              trendTone === "positive" && "text-[#15803d] dark:text-[#4ade80]",
              trendTone === "negative" && "text-accent",
              trendTone === "neutral" && "text-text-tertiary",
            )}
          >
            {trend}
          </div>
        )}
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
        "inline-block rounded-full px-3 py-1 text-[11px] font-semibold",
        status === "Published" &&
          "bg-[#f0fdf4] text-[#15803d] dark:bg-[#14532d30] dark:text-[#4ade80]",
        status === "Draft" &&
          "border border-border-default bg-subtle-bg text-text-tertiary",
        status === "Archived" &&
          "bg-[#fff7ed] text-[#c2410c] dark:bg-[#7c2d1230] dark:text-[#fb923c]",
      )}
    >
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
