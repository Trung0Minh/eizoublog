'use client';

import { motion, type HTMLMotionProps } from 'motion/react';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  index?: number
  delay?: number
}

export function ScrollReveal({
  children,
  className = '',
  index = 0,
  delay,
  ...props
}: ScrollRevealProps) {
  const finalDelay = delay !== undefined ? delay : index * 0.1;
  return (
    <motion.div
      className={className}
      transition={{ duration: 0.5, delay: finalDelay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
