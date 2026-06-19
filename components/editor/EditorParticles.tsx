"use client"

import { motion } from "motion/react"
import { useEffect, useRef, useState } from "react"

interface EditorParticle {
  driftX: number
  id: number
  rise: number
  scale: number
  x: number
  y: number
}

export function EditorParticles() {
  const [particles, setParticles] = useState<EditorParticle[]>([])
  const nextId = useRef(0)
  const cleanupTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  useEffect(() => {
    const timers = cleanupTimers.current

    const handleKeyDown = () => {
      const particle = {
        driftX: (Math.random() - 0.5) * 50,
        id: nextId.current++,
        rise: -100 - Math.random() * 50,
        scale: Math.random() + 0.5,
        x: Math.random() * 100,
        y: Math.random() * 100,
      }

      setParticles((current) => [...current.slice(-10), particle])

      const timer = setTimeout(() => {
        setParticles((current) =>
          current.filter(({ id }) => id !== particle.id),
        )
        timers.delete(timer)
      }, 1000)

      timers.add(timer)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      data-testid="editor-particles"
    >
      {particles.map((particle) => (
        <motion.div
          animate={{
            opacity: 0,
            scale: particle.scale,
            x: particle.driftX,
            y: particle.rise,
          }}
          className="absolute text-accent"
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          key={particle.id}
          style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="h-2 w-2 rounded-full bg-accent/40 shadow-[0_0_10px_var(--accent)] blur-[1px]" />
        </motion.div>
      ))}
    </div>
  )
}
