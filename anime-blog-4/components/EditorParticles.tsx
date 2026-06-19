'use client';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function EditorParticles() {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    let count = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Create a particle near the center of the screen
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const newParticle = { id: count++, x, y };

      setParticles((prev) => [...prev.slice(-10), newParticle]); // keep last 10

      // Remove after animation
      setTimeout(() => {
        setParticles((prev) => prev.filter(p => p.id !== newParticle.id));
      }, 1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0, y: 0, x: 0 }}
          animate={{ opacity: 0, scale: Math.random() * 1 + 0.5, y: -100 - Math.random() * 50, x: (Math.random() - 0.5) * 50 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute text-accent"
          style={{ top: `${p.y}%`, left: `${p.x}%` }}
        >
          <div className="w-2 h-2 rounded-full bg-accent/40 shadow-[0_0_10px_var(--accent)] blur-[1px]"></div>
        </motion.div>
      ))}
    </div>
  );
}
