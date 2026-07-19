'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const didHandlePointerRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollTarget = document.scrollingElement ?? document.documentElement;
    scrollTarget.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    document.body.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    didHandlePointerRef.current = true;
    scrollToTop();
  };

  const handleClick = () => {
    if (didHandlePointerRef.current) {
      didHandlePointerRef.current = false;
      return;
    }

    scrollToTop();
  };

  return (
    <button
      onClick={handleClick}
      onPointerUp={handlePointerUp}
      className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-accent text-white shadow-[0_4px_14px_rgba(255,20,147,0.4)] hover:scale-110 hover:bg-accent/90 transition-all duration-300 flex items-center justify-center group ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
      aria-label="Back to top"
    >
      <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
    </button>
  );
}
