'use client';

import { motion, type HTMLMotionProps } from 'motion/react';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  index?: number
}

export function ScrollReveal({
  children,
  className = '',
  index = 0,
  ...props
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
