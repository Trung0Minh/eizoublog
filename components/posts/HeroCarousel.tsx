'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

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
  const plugins = React.useMemo(() => [Autoplay()], []);
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
        <h2 className="text-[18px] font-bold text-text-primary tracking-tight">Featured Stories</h2>
      </div>

      <div className="overflow-hidden rounded-xl md:rounded-[20px] shadow-lg border-[3px] border-border/50 relative bg-subtle-bg" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {posts.map((post) => (
            <div className="flex-[0_0_100%] min-w-0 relative aspect-[16/10] md:aspect-[21/9]" key={post.slug || post.id}>
              <Link href={`/${post.slug}`} className="block w-full h-full relative cursor-pointer group">
                <img
                  src={post.coverUrl || 'https://picsum.photos/seed/placeholder/1200/600'}
                  alt={post.coverAlt || post.title}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-12">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className="transform transition-transform duration-700 ease-out md:translate-y-6 md:group-hover:translate-y-0">
                      <span className="bg-accent text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-max mb-3 flex items-center gap-1 shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 md:delay-100">
                        <Sparkles className="w-3 h-3" /> {post.category?.name || 'Featured'}
                      </span>
                      <h3 className="text-white text-[24px] md:text-[40px] font-display font-bold leading-tight mb-3 md:mb-4 max-w-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-100">
                        {post.title}
                      </h3>
                      <div className="grid grid-rows-[1fr] md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-all duration-700 ease-out opacity-100">
                        <div className="overflow-hidden md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 md:delay-200">
                          <p className="hidden md:block text-white/80 text-[14px] md:text-[18px] max-w-2xl line-clamp-2 md:line-clamp-3 mb-4 drop-shadow-sm mt-3">
                            {post.excerpt}
                          </p>
                          <span className="text-white/60 text-[12px] md:text-[14px] font-medium">
                            {formatCarouselDate(post)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
