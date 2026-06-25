'use client';

import { motion, type HTMLMotionProps } from 'motion/react';

import { useReducedVisualEffects } from '@/hooks/useReducedVisualEffects';

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
  const shouldReduce = useReducedVisualEffects();
  const finalDelay = delay !== undefined ? delay : index * 0.1;

  if (shouldReduce) {
    return (
      <motion.div className={className} initial={false} {...props}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.6, delay: finalDelay, ease: [0.2, 0.65, 0.3, 0.9] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
