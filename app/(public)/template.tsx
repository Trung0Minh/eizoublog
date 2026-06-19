'use client';

import { motion } from 'motion/react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      exit={{ y: -20, opacity: 0, filter: 'blur(10px)' }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
