'use client';
import { motion, useScroll, useSpring } from 'motion/react';

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-accent via-purple-500 to-accent shadow-[0_0_10px_var(--accent)] z-[100] origin-left"
      style={{ scaleX }}
    />
  );
}
