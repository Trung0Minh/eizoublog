"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { AnimatePresence, motion } from "motion/react"
import { usePathname } from "next/navigation"

import { useReducedVisualEffects } from "@/hooks/useReducedVisualEffects"

const emptySubscribe = () => () => undefined

export function DynamicBackground({
  customBackgrounds
}: {
  customBackgrounds?: Record<string, string> | null
}) {
  const { theme, systemTheme } = useTheme()
  const [season, setSeason] = useState("spring")
  // Use a CSS class toggle instead of Framer Motion animate prop for scroll transitions.
  // This lets the browser interpolate via CSS transition natively, which is smooth
  // during momentum scrolling rather than only firing after finger lift.
  const [homeContentActive, setHomeContentActive] = useState(false)
  const homeContentActiveRef = useRef(false)
  const shouldReduce = useReducedVisualEffects()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const pathname = usePathname()
  const isHome = pathname === "/"

  useEffect(() => {
    if (!isHome) return

    let frame: number | null = null
    const updateHomeContentState = () => {
      frame = null
      const nextActive = window.scrollY >= window.innerHeight * 0.75
      if (homeContentActiveRef.current !== nextActive) {
        homeContentActiveRef.current = nextActive
        setHomeContentActive(nextActive)
      }
    }
    const handleScroll = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(updateHomeContentState)
    }

    updateHomeContentState()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isHome])

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

  // Preload all 8 background images on every device so season switches are
  // always smooth. On mobile we defer by 2 s to avoid competing with the
  // initial paint; on desktop we start immediately.
  useEffect(() => {
    if (typeof window === "undefined") return

    const themes = ["light", "dark"]
    const seasons = ["spring", "summer", "autumn", "winter"]

    const preload = () => {
      seasons.forEach((s) => {
        themes.forEach((t) => {
          const key = `${s}_${t}`
          const url = customBackgrounds?.[key] || `/bg/${key}.jpg`
          const img = new window.Image()
          img.src = url
        })
      })
    }

    if (shouldReduce) {
      // Mobile: defer preloading so it doesn't compete with first paint
      const timer = setTimeout(preload, 2000)
      return () => clearTimeout(timer)
    } else {
      preload()
    }
  }, [customBackgrounds, shouldReduce])

  if (!mounted) return null

  const currentTheme = theme === "system" ? systemTheme : theme
  const isDark = currentTheme === "dark"

  const bgKey = `${season}_${isDark ? "dark" : "light"}`
  const bgUrl = customBackgrounds?.[bgKey] || `/bg/${bgKey}.jpg`
  const backgroundFilter = isHome
    ? "none"
    : shouldReduce
      ? "none"
      : "blur(6px)"

  const isHomeContentVisible = isHome && homeContentActive

  // CSS-driven transitions for the scroll fade — far smoother than Framer Motion
  // animate prop because the browser interpolates these natively every paint frame.
  const wrapperStyle: React.CSSProperties = {
    filter: backgroundFilter,
    opacity: isHome ? (isHomeContentVisible ? 0.4 : 1) : 0.4,
    transform: isHome
      ? isHomeContentVisible ? "scale(1.05)" : "scale(1)"
      : "scale(1.05)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  const overlayStyle: React.CSSProperties = {
    opacity: isHome ? (isHomeContentVisible ? 1 : 0) : 1,
    transition: "opacity 0.8s ease-out",
  }

  return (
    <div className="fixed inset-0 z-0 h-full w-full overflow-hidden pointer-events-none bg-transparent">
      <div className="absolute inset-0 w-full h-full" style={wrapperStyle}>
        <AnimatePresence initial={false}>
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
      </div>
      {/* A subtle overlay to ensure text remains readable */}
      <div
        className="absolute inset-0 bg-background/40 dark:bg-background/60"
        style={overlayStyle}
      />
    </div>
  )
}
