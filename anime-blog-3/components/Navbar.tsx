'use client';

import Link from 'next/link';
import { Menu, Search, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { SeasonToggle } from './SeasonToggle';
import { useState } from 'react';
import { MagneticEffect } from './MagneticEffect';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border h-14 w-full shadow-sm">
        <div className="max-w-[1440px] mx-auto px-5 h-full flex items-center justify-between">
          <Link href="/" className="font-bold text-[18px] text-accent flex items-center gap-2 tracking-tight group">
            <MagneticEffect strength={0.4}>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform text-accent block" />
            </MagneticEffect>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-500 drop-shadow-sm">
              Anime Blog
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <MagneticEffect>
              <Link href="/contributors" className="flex items-center gap-2 text-[14px] font-display font-bold tracking-wide text-secondary hover:text-accent transition-colors">
                Contributors
              </Link>
            </MagneticEffect>
            <MagneticEffect>
              <Link href="/resources" className="flex items-center gap-2 text-[14px] font-display font-bold tracking-wide text-secondary hover:text-accent transition-colors">
                Resources
              </Link>
            </MagneticEffect>
            <MagneticEffect>
              <Link href="/about" className="flex items-center gap-2 text-[14px] font-display font-bold tracking-wide text-secondary hover:text-accent transition-colors">
                About
              </Link>
            </MagneticEffect>
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                className="w-[280px] h-8 bg-subtle border border-border rounded-full pl-9 pr-4 text-[13px] text-primary placeholder:text-tertiary focus:outline-none focus:border-accent"
              />
              <Search className="absolute left-3 top-[8px] w-4 h-4 text-tertiary" />
            </div>
            <div className="flex items-center">
              <SeasonToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Right */}
          <div className="flex md:hidden items-center gap-1">
            <SeasonToggle />
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-secondary hover:text-primary ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[280px] bg-background h-full shadow-xl flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <span className="font-bold text-[16px] text-primary">Anime Blog</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-[28px] leading-none text-secondary hover:text-primary mb-1"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col p-6 gap-6 flex-1">
              <Link href="/contributors" className="text-[16px] font-display font-bold text-primary hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Contributors</Link>
              <Link href="/resources" className="text-[16px] font-display font-bold text-primary hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Resources</Link>
              <Link href="/about" className="text-[16px] font-display font-bold text-primary hover:text-accent" onClick={() => setMobileMenuOpen(false)}>About</Link>

              <div className="mt-8 relative">
                <input
                  type="text"
                  placeholder="Search posts..."
                  className="w-full h-10 bg-subtle border border-border rounded-lg pl-10 pr-4 text-[14px] text-primary placeholder:text-tertiary"
                />
                <Search className="absolute left-3 top-[10px] w-4 h-4 text-tertiary" />
              </div>
            </div>
            <div className="p-6 border-t border-border flex flex-col gap-4">
              <Link href="/editor" className="text-[14px] font-medium text-primary">My Posts (Editor demo)</Link>
              <Link href="#" className="text-[14px] font-medium text-primary">Edit Profile</Link>
              <Link href="#" className="text-[14px] font-medium text-accent mt-4">Sign out</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
