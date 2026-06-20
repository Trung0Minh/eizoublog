"use client"

import { motion } from "motion/react"
import { useReducedVisualEffects } from "@/hooks/useReducedVisualEffects"

export function AnimatedDecorators() {
  const shouldReduce = useReducedVisualEffects()

  if (shouldReduce) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden opacity-30 dark:opacity-20">
      {/* Decorative Line 1: Top Right */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute -right-10 top-20 w-[300px] h-[300px] text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      >
        <motion.path
          d="M 0 100 Q 50 50 100 0"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
        />
        <motion.path
          d="M 10 100 Q 60 50 100 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.7 }}
        />
      </motion.svg>

      {/* Decorative Line 2: Bottom Left (fixed position) */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute -left-20 bottom-20 w-[400px] h-[400px] text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      >
        <motion.path
          d="M 100 100 Q 50 50 0 0"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 1 }}
        />
        <motion.path
          d="M 90 100 Q 40 50 0 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 1.2 }}
        />
      </motion.svg>
    </div>
  )
}
