'use client';
import { motion } from 'motion/react';

export function TextReveal({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ');

  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="mr-[0.25em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
