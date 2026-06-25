"use client"

import { motion, AnimatePresence } from "motion/react"
import { ChevronDown } from "lucide-react"
import { useEffect, useState, useSyncExternalStore } from "react"

interface HomeIntroProps {
  appName: string
}

type Season = "spring" | "summer" | "autumn" | "winter"

interface SeasonConfig {
  subFont: string
  subtitle: string
  textColor: string
  titleFont: string
}

const emptySubscribe = () => () => undefined

const seasonConfigs: Record<Season, SeasonConfig> = {
  spring: {
    titleFont: "font-serif italic tracking-tight font-medium",
    subFont: "font-sans font-medium",
    subtitle: "A Season of New Beginnings",
    textColor: "text-pink-50",
  },
  summer: {
    titleFont: "font-display uppercase tracking-[0.2em] font-black",
    subFont: "font-mono text-sm tracking-widest uppercase",
    subtitle: "Vibrant Summer Adventures",
    textColor: "text-yellow-50",
  },
  autumn: {
    titleFont: "font-serif font-bold tracking-normal",
    subFont: "font-serif italic",
    subtitle: "Falling into Beautiful Stories",
    textColor: "text-orange-50",
  },
  winter: {
    titleFont: "font-sans font-light tracking-[0.1em]",
    subFont: "font-sans font-light tracking-widest",
    subtitle: "A Quiet Winter Escape",
    textColor: "text-blue-50",
  },
}

export function HomeIntro({ appName }: HomeIntroProps) {
  const [season, setSeason] = useState<Season>("spring")
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  useEffect(() => {
    const updateSeason = () => {
      const storedSeason = localStorage.getItem("season")
      if (
        storedSeason === "spring" ||
        storedSeason === "summer" ||
        storedSeason === "autumn" ||
        storedSeason === "winter"
      ) {
        setSeason(storedSeason)
      } else {
        const month = new Date().getMonth()
        if (month >= 2 && month <= 4) setSeason("spring")
        else if (month >= 5 && month <= 7) setSeason("summer")
        else if (month >= 8 && month <= 10) setSeason("autumn")
        else setSeason("winter")
      }
    }

    updateSeason()
    window.addEventListener("seasonchange", updateSeason)
    return () => window.removeEventListener("seasonchange", updateSeason)
  }, [])

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    })
  }

  if (!mounted) return <div className="w-full h-[calc(100dvh-70px)]" />

  const config = seasonConfigs[season]

  return (
    <div
      className="w-full h-[calc(100dvh-70px)] flex flex-col items-center justify-center relative overflow-hidden"
      data-home-intro
    >
      {/*
        One motion.div handles the season-switch fade (single node, negligible cost).
        Per-character animation is pure CSS via char-anim / char-anim-{season} classes
        and --char-i custom property — runs on compositor thread, zero JS per frame.
        When season changes, AnimatePresence unmounts the old div and mounts the new one,
        which restarts all CSS animations automatically on the new characters.
      */}
      <AnimatePresence mode="wait">
        <motion.div
          key={season}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="text-center"
        >
          <h1
            className={`text-5xl sm:text-6xl md:text-8xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] mb-6 ${config.titleFont} ${config.textColor}`}
          >
            {appName.split("").map((char, i) => (
              <span
                key={`title-${i}`}
                className={`char-anim-${season}`}
                style={{ "--char-i": i } as React.CSSProperties}
              >
                {char}
              </span>
            ))}
          </h1>
          <p
            className={`text-lg md:text-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${config.subFont} ${config.textColor} opacity-90`}
          >
            {config.subtitle.split("").map((char, i) => (
              <span
                key={`sub-${i}`}
                className={`char-anim-${season}`}
                style={
                  {
                    "--char-i": appName.length + i,
                  } as React.CSSProperties
                }
              >
                {char}
              </span>
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
