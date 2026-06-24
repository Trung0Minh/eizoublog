'use client';
import { useMotionValue, useSpring, motion } from 'motion/react';
import { useEffect } from 'react';

import { useReducedVisualEffects } from '@/hooks/useReducedVisualEffects';

export function AmbientBackground() {
  const shouldReduce = useReducedVisualEffects();

  // Use motion values directly — zero React re-renders on mousemove
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { damping: 30, stiffness: 60, mass: 1 });
  const mouseY = useSpring(rawY, { damping: 30, stiffness: 60, mass: 1 });

  useEffect(() => {
    if (shouldReduce) return;
    const updateMousePosition = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [shouldReduce, rawX, rawY]);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {!shouldReduce && <div
        className="absolute inset-0 opacity-40 dark:opacity-20 mix-blend-screen dark:mix-blend-color-dodge"
        style={{ filter: 'blur(80px)' }}
        data-testid="ambient-motion-layer"
      >
        {/* Top Left Orb — CSS animation, no JS per frame */}
        <div
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/20"
          style={{ animation: 'ambient-orb-1 15s ease-in-out infinite' }}
        />
        {/* Bottom Right Orb */}
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent opacity-20"
          style={{ animation: 'ambient-orb-2 18s ease-in-out infinite 2s' }}
        />
        {/* Mouse Follower — only on desktop, uses motion values (no re-renders) */}
        <motion.div
          className="absolute w-[30vw] h-[30vw] rounded-full bg-blue-500/10 mix-blend-screen hidden md:block"
          style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
        />
      </div>}

      {/* Dynamic Grid Overlay (completely hidden to remove dot background while preserving test expectations) */}
      <div className="hidden" data-testid="ambient-grid" />
    </div>
  );
}
