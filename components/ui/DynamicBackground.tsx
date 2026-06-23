"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react"
import { usePathname } from "next/navigation"

const emptySubscribe = () => () => undefined

export function DynamicBackground({
  customBackgrounds
}: {
  customBackgrounds?: Record<string, string> | null
}) {
  const { theme, systemTheme } = useTheme()
  const [season, setSeason] = useState("spring")
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const { scrollY } = useScroll()
  const pathname = usePathname()
  const isHome = pathname === "/"

  // Keep scroll effects to compositor-friendly opacity/transform work.
  const homeOpacity = useTransform(scrollY, [0, 600], [1, 0.4])
  const homeScale = useTransform(scrollY, [0, 1000], [1, 1.05])
  const homeOverlayOpacity = useTransform(scrollY, [0, 600], [0, 1])

  useEffect(() => {
    const updateSeason = () => {
      const storedSeason = localStorage.getItem("season")
      if (storedSeason) {
        setSeason(storedSeason)
      } else {
        const month = new Date().getMonth()
        if (month >= 2 && month <= 4) setSeason("spring")
        else if (month >= 5 && month <= 7) setSeason("summer")
        else if (month >= 8 && month <= 10) setSeason("autumn")
        else setSeason("winter")
      }
    }

    const timer = setTimeout(updateSeason, 0)

    window.addEventListener("seasonchange", updateSeason)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("seasonchange", updateSeason)
    }
  }, [])

  if (!mounted) return null

  const currentTheme = theme === "system" ? systemTheme : theme
  const isDark = currentTheme === "dark"

  const bgKey = `${season}_${isDark ? "dark" : "light"}`
  const bgUrl = customBackgrounds?.[bgKey] || `/bg/${bgKey}.jpg`
  const backgroundFilter = isHome ? "none" : "blur(6px)"

  return (
    <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden pointer-events-none bg-background">
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          filter: backgroundFilter,
          opacity: isHome ? homeOpacity : 0.4,
          scale: isHome ? homeScale : 1.05,
        }}
      >
        <AnimatePresence>
          <motion.div
            key={bgUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgUrl})` }}
          />
        </AnimatePresence>
      </motion.div>
      {/* A subtle overlay to ensure text remains readable */}
      <motion.div 
        className="absolute inset-0 bg-background/40 dark:bg-background/60" 
        style={{ opacity: isHome ? homeOverlayOpacity : 1 }}
      />
    </div>
  )
}
