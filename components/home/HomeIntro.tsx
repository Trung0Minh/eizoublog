"use client"

import { motion, AnimatePresence, type Variants } from "motion/react"
import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import type { AppearanceSeason } from "@/lib/appearanceSession"
import { getDocumentSeason } from "@/lib/appearanceSession"

interface HomeIntroProps {
  appName: string
  initialSeason: AppearanceSeason
}

type Season = AppearanceSeason

interface SeasonConfig {
  container: Variants
  item: Variants
  subFont: string
  subtitle: string
  textColor: string
  titleFont: string
}

const seasonConfigs: Record<Season, SeasonConfig> = {
  spring: {
    titleFont: "font-serif italic tracking-tight font-medium",
    subFont: "font-sans font-medium",
    subtitle: "Mùa của những khởi đầu mới",
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
    },
    item: {
      hidden: { opacity: 0, y: 30, rotate: -15 },
      visible: { opacity: 1, y: 0, rotate: 0, transition: { type: "spring", damping: 12, stiffness: 200 } },
    },
    textColor: "text-pink-50"
  },
  summer: {
    titleFont: "font-display uppercase tracking-[0.2em] font-black",
    subFont: "font-mono text-sm tracking-widest uppercase",
    subtitle: "Những chuyến phiêu lưu mùa hạ",
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
    },
    item: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1, transition: { type: "spring", damping: 12, stiffness: 250 } },
    },
    textColor: "text-yellow-50"
  },
  autumn: {
    titleFont: "font-serif font-bold tracking-normal",
    subFont: "font-serif italic",
    subtitle: "Rơi vào những câu chuyện đẹp",
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
    },
    item: {
      hidden: { opacity: 0, x: -30 },
      visible: { opacity: 1, x: 0, transition: { type: "spring", damping: 15, stiffness: 150 } },
    },
    textColor: "text-orange-50"
  },
  winter: {
    titleFont: "font-sans font-light tracking-[0.1em]",
    subFont: "font-sans font-light tracking-widest",
    subtitle: "Một chốn trốn yên tĩnh mùa đông",
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
    },
    item: {
      hidden: { opacity: 0, filter: "blur(10px)" },
      visible: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: "easeOut" } },
    },
    textColor: "text-blue-50"
  }
}

export function HomeIntro({ appName, initialSeason }: HomeIntroProps) {
  const [season, setSeason] = useState<Season>(initialSeason)
  useEffect(() => {
    const updateSeason = () => {
      setSeason(getDocumentSeason())
    }

    updateSeason()
    window.addEventListener("seasonchange", updateSeason)
    return () => window.removeEventListener("seasonchange", updateSeason)
  }, [])

  const scrollToContent = () => {
    const intro = document.querySelector<HTMLElement>("[data-home-intro]")
    window.scrollTo({
      top: intro?.offsetHeight ?? window.innerHeight,
      behavior: "smooth",
    })
  }

  const config = seasonConfigs[season]
  const titleSizeClass = season === "summer"
    ? "text-[2.35rem] sm:text-6xl md:text-8xl"
    : "text-5xl sm:text-6xl md:text-8xl"

  return (
    <div
      className="h-[calc(100svh-70px)] w-full flex flex-col items-center justify-center relative overflow-hidden md:h-[calc(100dvh-70px)]"
      data-home-intro
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={season}
          variants={config.container}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="text-center"
        >
          <h1 className={`${titleSizeClass} whitespace-nowrap drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] mb-6 ${config.titleFont} ${config.textColor}`}>
            {appName.split("").map((char, i) => (
              <motion.span key={`title-${i}`} variants={config.item} className="inline-block whitespace-pre">
                {char}
              </motion.span>
            ))}
          </h1>
          <p className={`text-lg md:text-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${config.subFont} ${config.textColor} opacity-90`}>
            {config.subtitle.split("").map((char, i) => (
              <motion.span key={`sub-${i}`} variants={config.item} className="inline-block whitespace-pre">
                {char}
              </motion.span>
            ))}
          </p>
        </motion.div>
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        onClick={scrollToContent}
        className="absolute bottom-12 text-white/80 hover:text-white transition-colors animate-bounce cursor-pointer p-4"
        aria-label="Scroll down"
      >
        <ChevronDown className="w-10 h-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
      </motion.button>
    </div>
  )
}
