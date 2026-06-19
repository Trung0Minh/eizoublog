'use client';
import { Flower2, Umbrella, Leaf, Snowflake } from 'lucide-react';
import { useEffect, useState } from 'react';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export function SeasonToggle() {
  const [season, setSeason] = useState('spring');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setMounted(true);
      setSeason(document.documentElement.getAttribute('data-season') || 'spring');
    }, 0);
    return () => clearTimeout(handler);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-season') || 'spring';
      setSeason(current);
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) return <div className="w-8 h-8" />;

  const cycleSeason = () => {
    const idx = (SEASONS.indexOf(season) + 1) % SEASONS.length;
    const next = SEASONS[idx];
    setSeason(next);
    localStorage.setItem('season', next);
    document.documentElement.setAttribute('data-season', next);
    window.dispatchEvent(new Event('seasonchange'));
  };

  return (
    <button
      onClick={cycleSeason}
      className="p-2 -mx-1 rounded-full hover:bg-subtle transition-colors flex items-center justify-center text-secondary hover:text-primary"
      aria-label="Toggle season"
    >
      {season === 'spring' && <Flower2 className="w-4 h-4" />}
      {season === 'summer' && <Umbrella className="w-4 h-4" />}
      {season === 'autumn' && <Leaf className="w-4 h-4" />}
      {season === 'winter' && <Snowflake className="w-4 h-4" />}
    </button>
  );
}
