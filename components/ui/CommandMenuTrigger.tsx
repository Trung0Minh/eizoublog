"use client"

import { Search } from "lucide-react"
import { MagneticEffect } from "./MagneticEffect"
import { motion } from "motion/react"

export function CommandMenuTrigger() {
  return (
    <MagneticEffect>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => document.dispatchEvent(new CustomEvent("open-command-menu"))}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default bg-subtle-bg text-text-secondary transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Tìm kiếm bài viết"
        title="Tìm kiếm"
      >
        <Search className="h-4 w-4" />
      </motion.button>
    </MagneticEffect>
  )
}
