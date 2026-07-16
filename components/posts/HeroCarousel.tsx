'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { getCoverObjectPositionStyle } from '@/lib/cover-style';

interface HeroCarouselPost {
  category: { name: string } | null
  coverAlt: string | null
  coverUrl: string | null
  createdAt?: Date | string
  excerpt: string | null
  id?: string
  publishedAt: Date | string | null
  slug: string
  title: string
}

function formatCarouselDate(post: HeroCarouselPost) {
  const date = post.publishedAt ?? post.createdAt

  // Return ISO string or fixed string for server to prevent hydration mismatch,
  // or rely on a client-side only render. But for now, let's just return a simpler string 
  // without relying on user's local timezone, or use suppressHydrationWarning on the element.
  if (!date) return null;
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function HeroCarousel({ posts }: { posts: HeroCarouselPost[] }) {
  const plugins = React.useMemo(() => [Autoplay({ delay: 4000, stopOnInteraction: false })], []);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, plugins);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (!posts || posts.length === 0) return null;

  return (
    <div className="relative w-full max-w-[1440px] auto mb-8 md:mb-12 mt-4 px-4 md:px-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent animate-pulse" />
        <h2 className="text-[18px] font-bold tracking-tight">Featured Stories</h2>
      </div>

      <div className="glass-card overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {posts.map((post) => (
            <div className="flex-[0_0_100%] min-w-0 relative aspect-video" key={post.slug || post.id}>
              <Link href={`/${post.slug}`} className="block w-full h-full relative cursor-pointer group">
                <img
                  src={post.coverUrl?.split('?')[0] || 'https://picsum.photos/seed/placeholder/1200/600'}
                  alt={post.coverAlt || post.title}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  fetchPriority="high"
                  style={getCoverObjectPositionStyle(post.coverUrl)}
                />
                <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-12">
                  <div>
                    <div className="transform transition-transform duration-700 ease-out md:translate-y-6 md:group-hover:translate-y-0">
                      <span className="bg-accent text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-max mb-3 flex items-center gap-1 shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 md:delay-100">
                        <Sparkles className="w-3 h-3" /> {post.category?.name || 'Featured'}
                      </span>
                      <h3 className="text-white text-[19px] md:text-[34px] lg:text-[38px] font-display font-bold leading-[1.18] md:leading-[1.15] mb-3 md:mb-4 max-w-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-100">
                        {post.title}
                      </h3>
                      <div className="grid grid-rows-[1fr] md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-all duration-700 ease-out opacity-100">
                        <div className="overflow-hidden md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 md:delay-200">
                          <p className="mt-3 hidden max-w-4xl break-words text-[14px] text-white/80 drop-shadow-sm [overflow-wrap:anywhere] md:mb-4 md:block md:text-[16px]">
                            {post.excerpt}
                          </p>
                          <span className="text-white/60 text-[12px] md:text-[13px] font-medium">
                            {formatCarouselDate(post)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {posts.map((_, index) => (
          <button
            key={index}
            className={`h-2.5 rounded-full transition-all duration-300 ${index === selectedIndex ? 'w-8 bg-accent' : 'w-2.5 bg-border-strong hover:bg-accent/50'}`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={'Jump to slide ' + (index + 1)}
          />
        ))}
      </div>
    </div>
  );
}
