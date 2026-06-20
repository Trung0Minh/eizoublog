'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

import { useReducedVisualEffects } from '@/hooks/useReducedVisualEffects';

export function CustomCursor() {
  const shouldReduce = useReducedVisualEffects();
  const [isVisible, setIsVisible] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorXDot = useMotionValue(-100);
  const cursorYDot = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (shouldReduce) {
      return;
    }

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      cursorXDot.set(e.clientX - 4);
      cursorYDot.set(e.clientY - 4);
      setIsVisible(true);
    };

    document.body.addEventListener('mousemove', moveCursor);

    return () => {
      document.body.removeEventListener('mousemove', moveCursor);
    };
  }, [cursorX, cursorY, cursorXDot, cursorYDot, shouldReduce]);

  if (shouldReduce) return null;

  return (
    <>
      <motion.div
        data-testid="custom-cursor"
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9999] hidden md:flex items-center justify-center border-2 border-accent/50 rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          opacity: isVisible ? 1 : 0
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-accent pointer-events-none z-[9999] hidden md:block rounded-full shadow-[0_0_10px_var(--accent)]"
        style={{
          x: cursorXDot,
          y: cursorYDot,
          opacity: isVisible ? 1 : 0
        }}
      />
    </>
  );
}
