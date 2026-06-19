'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { POSTS } from '@/lib/posts';

export function HeroCarousel() {
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

  return (
    <div className="relative w-full max-w-[1440px] auto mb-8 md:mb-12 mt-4 px-4 md:px-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent animate-pulse" />
        <h2 className="text-[18px] font-bold text-primary tracking-tight">Featured Stories</h2>
      </div>

      <div className="overflow-hidden rounded-xl md:rounded-[20px] shadow-lg border-[3px] border-border/50 relative bg-subtle" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {POSTS.map((post) => (
            <div className="flex-[0_0_100%] min-w-0 relative aspect-[16/10] md:aspect-[21/9]" key={post.id}>
              <Link href={`/post/` + post.id} className="block w-full h-full relative cursor-pointer group">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  priority
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-12">
                  <div className="transform transition-transform duration-700 ease-out md:translate-y-6 md:group-hover:translate-y-0">
                    <span className="bg-accent text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-max mb-3 flex items-center gap-1 shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 md:delay-100">
                      <Sparkles className="w-3 h-3" /> {post.category}
                    </span>
                    <h3 className="text-white text-[24px] md:text-[40px] font-display font-bold leading-tight mb-3 md:mb-4 max-w-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-100">
                      {post.title}
                    </h3>
                    <p className="text-white/80 text-[14px] md:text-[18px] font-serif max-w-2xl line-clamp-2 md:line-clamp-3 mb-4 drop-shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 md:delay-200">
                      {post.excerpt}
                    </p>
                    <span className="text-white/60 text-[12px] md:text-[14px] font-medium md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 md:delay-300">{post.date}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {POSTS.map((_, index) => (
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
