"use client"

import { motion, AnimatePresence } from "motion/react"
import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"

interface HomeIntroProps {
  appName: string
}

const seasonConfigs = {
  spring: {
    titleFont: "font-serif italic tracking-tight font-medium",
    subFont: "font-sans font-medium",
    subtitle: "A Season of New Beginnings",
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
    subtitle: "Vibrant Summer Adventures",
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
    subtitle: "Falling into Beautiful Stories",
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
    subtitle: "A Quiet Winter Escape",
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

export function HomeIntro({ appName }: HomeIntroProps) {
  const [season, setSeason] = useState("spring")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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

  const config = seasonConfigs[season as keyof typeof seasonConfigs] || seasonConfigs.spring

  return (
    <div className="w-full h-[calc(100dvh-70px)] flex flex-col items-center justify-center relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={season}
          variants={config.container}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="text-center"
        >
          <h1 className={`text-5xl sm:text-6xl md:text-8xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] mb-6 ${config.titleFont} ${config.textColor}`}>
            {appName.split("").map((char, i) => (
              <motion.span key={`title-${i}`} variants={config.item as any} className="inline-block whitespace-pre">
                {char}
              </motion.span>
            ))}
          </h1>
          <p className={`text-lg md:text-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${config.subFont} ${config.textColor} opacity-90`}>
            {config.subtitle.split("").map((char, i) => (
              <motion.span key={`sub-${i}`} variants={config.item as any} className="inline-block whitespace-pre">
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
