"use client"

import { motion } from "motion/react"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-[32px] bg-subtle-bg/40 px-8 py-24 text-center ${className || ''}`}>
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-subtle-bg shadow-sm"
      >
        <Icon className="h-10 w-10 text-muted-foreground" />
      </motion.div>
      <h3 className="mb-3 text-[24px] font-bold tracking-tight text-text-primary">{title}</h3>
      {description && (
        <p className="max-w-[400px] text-[15px] leading-relaxed text-text-secondary">
          {description}
        </p>
      )}
    </div>
  )
}
