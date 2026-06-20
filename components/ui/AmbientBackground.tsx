'use client';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { useReducedVisualEffects } from '@/hooks/useReducedVisualEffects';

export function AmbientBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const shouldReduce = useReducedVisualEffects();

  useEffect(() => {
    if (shouldReduce) return;

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [shouldReduce]);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Decorative Orbs */}
      {!shouldReduce && <div
        className="absolute inset-0 opacity-40 dark:opacity-20 mix-blend-screen dark:mix-blend-color-dodge blur-[120px]"
        data-testid="ambient-motion-layer"
      >
        {/* Top Left Orb */}
        <motion.div
           className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/20"
           animate={{
             x: [0, 50, -20, 0],
             y: [0, -30, 40, 0],
             scale: [1, 1.1, 0.9, 1],
           }}
           transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Bottom Right Orb */}
        <motion.div
           className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent opacity-20"
           animate={{
             x: [0, -60, 30, 0],
             y: [0, 40, -50, 0],
             scale: [1, 0.8, 1.2, 1],
           }}
           transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        {/* Mouse Follower */}
        <motion.div
           className="absolute w-[30vw] h-[30vw] rounded-full bg-blue-500/10 mix-blend-screen"
           animate={{
             x: mousePosition.x,
             y: mousePosition.y,
           }}
           transition={{ type: "spring", stiffness: 40, damping: 20 }}
        />
      </div>}

      {/* Dynamic Grid Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.25] dark:opacity-[0.1]"
        data-testid="ambient-grid"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />
    </div>
  );
}
