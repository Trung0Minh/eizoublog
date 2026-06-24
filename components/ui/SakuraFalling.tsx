'use client';

import { useEffect, useState } from 'react';

import { useParticleEffects } from '@/hooks/useParticleEffects';

const containPaint = { contain: 'layout paint style' } as React.CSSProperties;

export function SeasonalEffects() {
  const [season, setSeason] = useState('spring');
  const [particles, setParticles] = useState<Array<{ id: number, left: string, animationDuration: string, animationDelay: string, scale: number }>>([]);
  const { enabled: particlesEnabled } = useParticleEffects();

  useEffect(() => {
    const detectSeason = () => {
      setSeason(document.documentElement.getAttribute('data-season') || 'spring');
    };
    detectSeason();

    const handleSeasonChange = () => detectSeason();
    window.addEventListener('seasonchange', handleSeasonChange);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-season') detectSeason();
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      window.removeEventListener('seasonchange', handleSeasonChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!particlesEnabled) {
      return;
    }

    const timer = setTimeout(() => {
      const length = 16;
      const newParticles = Array.from({ length }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}vw`,
        animationDuration: season === 'summer' ? `${6 + Math.random() * 8}s` : season === 'winter' ? `${8 + Math.random() * 12}s` : `${10 + Math.random() * 15}s`,
        animationDelay: `-${Math.random() * 20}s`,
        scale: 0.4 + Math.random() * 0.8,
      }));
      setParticles(newParticles);
    }, 0);
    return () => clearTimeout(timer);
  }, [season, particlesEnabled]);

  const visibleParticles = particlesEnabled ? particles : [];

  if (visibleParticles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
      aria-hidden="true"
      style={containPaint}
    >
      {visibleParticles.map((particle) => {
        let className = "absolute top-0";
        if (season === 'spring') className = "sakura-petal absolute top-0";
        else if (season === 'summer') className = "summer-firefly absolute top-0";
        else if (season === 'autumn') className = "autumn-leaf absolute top-0";
        else if (season === 'winter') className = "winter-snow absolute top-0";

        return (
          <div
            data-testid="seasonal-particle"
            key={particle.id}
            className={className}
            style={{
              left: particle.left,
              animationDuration: particle.animationDuration,
              animationDelay: particle.animationDelay,
              transform: `scale(${particle.scale})`,
              '--scale': particle.scale
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
