'use client';
import { Flower2, Umbrella, Leaf, Snowflake } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  getDocumentSeason,
  setSessionSeason,
  type AppearanceSeason,
} from '@/lib/appearanceSession';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export function SeasonToggle() {
  const [season, setSeason] = useState<AppearanceSeason>('spring');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setMounted(true);
      setSeason(getDocumentSeason());
    }, 0);
    return () => clearTimeout(handler);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const observer = new MutationObserver(() => {
      setSeason(getDocumentSeason());
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) return <div className="w-8 h-8" />;

  const cycleSeason = () => {
    const idx = (SEASONS.indexOf(season) + 1) % SEASONS.length;
    const next = SEASONS[idx] as AppearanceSeason;
    setSeason(next);
    setSessionSeason(next);
    document.documentElement.setAttribute('data-season', next);
    window.dispatchEvent(new Event('seasonchange'));
  };

  return (
    <button
      onClick={cycleSeason}
      className="h-8 w-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-subtle-bg hover:text-text-primary transition-colors"
      aria-label="Toggle season"
    >
      {season === 'spring' && <Flower2 className="w-[18px] h-[18px]" />}
      {season === 'summer' && <Umbrella className="w-[18px] h-[18px]" />}
      {season === 'autumn' && <Leaf className="w-[18px] h-[18px]" />}
      {season === 'winter' && <Snowflake className="w-[18px] h-[18px]" />}
    </button>
  );
}
