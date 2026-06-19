import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroCarousel } from '@/components/HeroCarousel';
import { Sparkles } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { MagneticEffect } from '@/components/MagneticEffect';

import { POSTS } from '@/lib/posts';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col pt-0">
      <Navbar />
      <div className="w-full flex justify-center">
        <HeroCarousel />
      </div>
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 md:pt-4 pb-20">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-12 lg:gap-12">

          {/* Left Column - Post List */}
          <div className="flex-1 w-full lg:max-w-[72%] flex flex-col gap-7 md:gap-10">
            {POSTS.map((post, i) => (
              <ScrollReveal
                key={post.id}
                index={i}
                className="group flex flex-col bg-subtle/30 p-4 border-[2px] border-transparent hover:border-border hover:shadow-lg rounded-[16px] transition-all duration-300"
              >
                <article>
                  <Link href={`/post/${post.id}`} className="block overflow-hidden rounded-[8px]">
                  <div className="relative w-full aspect-video isolate bg-subtle rounded-[8px] overflow-hidden border-2 border-dashed border-border group-hover:border-accent/40 transition-colors">
                     <Image
                        src={post.thumbnailImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                        referrerPolicy="no-referrer"
                     />
                  </div>
                </Link>
                <div className="mt-2 text-[11px] font-semibold text-accent uppercase tracking-[0.08em]">
                  {post.category}
                </div>
                <Link href={`/post/${post.id}`}>
                  <h2 className="mt-1 text-[20px] font-display font-bold text-primary leading-[1.3] transition-colors group-hover:text-accent line-clamp-2">
                    {post.title}
                  </h2>
                </Link>
                <Link href={`/post/${post.id}`}>
                  <p className="hidden md:block mt-2 text-[14px] text-secondary font-serif leading-[1.65] line-clamp-3">
                    {post.excerpt}
                  </p>
                </Link>
                <div className="mt-4 flex items-center justify-between text-[13px] text-primary/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#2d6e7e] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                      {post.authorInitials}
                    </div>
                    <span className="font-semibold text-primary">{post.author}</span>
                    <span className="text-tertiary">&middot;</span>
                    <span className="text-secondary text-[12px]">{post.date}</span>
                  </div>
                  <div className="text-secondary text-[12px]">{post.commentCount}</div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-subtle text-primary text-[11px] rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                </article>
              </ScrollReveal>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8 md:mt-12">
              <MagneticEffect><button className="w-8 h-8 rounded-full bg-primary text-background text-[13px] font-medium flex items-center justify-center">1</button></MagneticEffect>
              <MagneticEffect><button className="w-8 h-8 rounded-full hover:bg-subtle text-primary text-[13px] font-medium flex items-center justify-center">2</button></MagneticEffect>
              <MagneticEffect><button className="w-8 h-8 rounded-full hover:bg-subtle text-primary text-[13px] font-medium flex items-center justify-center">3</button></MagneticEffect>
              <span className="text-secondary tracking-widest px-1">...</span>
              <MagneticEffect><button className="w-8 h-8 rounded-full hover:bg-subtle text-primary text-[13px] font-medium flex items-center justify-center">12</button></MagneticEffect>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <aside className="w-full lg:w-[240px] shrink-0 flex flex-col gap-10 mt-4 lg:mt-0">
            {/* Newsletter */}
            <div className="flex flex-col border-none">
              <h3 className="text-[13px] font-display font-bold text-accent uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Newsletter
              </h3>
              <p className="text-[13px] text-secondary mb-3">Get notified when new posts are published.</p>
              <input
                type="email"
                placeholder="Email address"
                className="w-full border border-border rounded-[4px] px-2 py-2 text-[13px] bg-transparent text-primary focus:outline-none focus:border-primary mb-3"
              />
              <button className="w-full h-10 bg-brand text-brand-foreground font-medium text-[13px] rounded-[4px] hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-border" />

            {/* Categories */}
            <div className="flex flex-col">
              <h3 className="text-[13px] font-display font-bold text-accent uppercase tracking-wider mb-4 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Categories
              </h3>
              <ul className="flex flex-col gap-3 text-[13px]">
                <li className="flex flex-col">
                  <div className="flex justify-between text-primary hover:text-accent cursor-pointer group">
                    <span className="group-hover:text-accent transition-colors">Analysis</span>
                    <span className="text-tertiary">24</span>
                  </div>
                  <ul className="flex flex-col gap-2 mt-2 ml-[6px] pl-3 border-l-[1px] border-border">
                    <li className="flex justify-between text-secondary hover:text-accent cursor-pointer">
                      <span>Animation Analysis</span>
                      <span className="text-tertiary">12</span>
                    </li>
                    <li className="flex justify-between text-secondary hover:text-accent cursor-pointer">
                      <span>Narrative Analysis</span>
                      <span className="text-tertiary">8</span>
                    </li>
                  </ul>
                </li>
                <li className="flex justify-between text-primary hover:text-accent cursor-pointer group">
                  <span className="group-hover:text-accent transition-colors">Reviews</span>
                  <span className="text-tertiary">18</span>
                </li>
                <li className="flex justify-between text-primary hover:text-accent cursor-pointer group">
                  <span className="group-hover:text-accent transition-colors">Essays</span>
                  <span className="text-tertiary">7</span>
                </li>
              </ul>
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-border" />

            {/* Recent Posts */}
            <div className="flex flex-col">
              <h3 className="text-[13px] font-display font-bold text-accent uppercase tracking-wider mb-4 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Recent Posts
              </h3>
              <ul className="flex flex-col gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex flex-col group cursor-pointer">
                    <h4 className="text-[13px] text-primary group-hover:text-accent leading-tight line-clamp-2 transition-colors">
                      {i === 1 ? "The Sound Design Philosophy Behind Chainsaw Man's Most Brutal Scenes" : "Comparing Directorial Approaches in Modern Fantasy Adaptations"}
                    </h4>
                    <span className="text-[12px] text-secondary mt-1">Mar {15 - i}, 2025</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        </div>
      </main>
      <Footer />
    </div>
  );
}
