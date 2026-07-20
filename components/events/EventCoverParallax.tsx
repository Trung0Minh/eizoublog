'use client';

import { motion, useScroll, useTransform } from "motion/react"

import { getCoverStyle } from "@/lib/cover-style"

interface EventCoverParallaxProps {
  alt: string
  src: string
}

export function EventCoverParallax({ alt, src }: EventCoverParallaxProps) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, 400])

  return (
    <motion.div
      className="absolute inset-0 -z-20 h-full md:top-[-20vh] md:h-[120%]"
      style={{ y }}
    >
      <img
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        fetchPriority="high"
        loading="eager"
        src={src.split("?")[0]}
        style={getCoverStyle(src)}
      />
    </motion.div>
  )
}
