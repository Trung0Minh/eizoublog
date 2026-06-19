'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Check, AlertCircle, Image as ImageIcon, Video, EyeOff, LayoutTemplate, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EditorParticles } from '@/components/EditorParticles';

export default function EditorPage() {
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saved');
  const [hasCoverImage, setHasCoverImage] = useState(false);
  const [title, setTitle] = useState('The Sound Design Philosophy Behind Chainsaw Man\'s Most Brutal Scenes');
  const [excerpt, setExcerpt] = useState('MAPPA\'s approach to sound in Chainsaw Man represents a complete rethinking of how anime uses audio to convey physical violence...');

  // Mock saving effect
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSaveState('saving');
      setTimeout(() => setSaveState('saved'), 1500);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-transparent min-h-[100dvh] flex flex-col relative font-sans text-primary selection:bg-accent/20">
      <EditorParticles />

      {/* Editor Top Bar */}
      <header className="fixed top-0 inset-x-0 h-12 bg-background/80 backdrop-blur-xl border-b border-border/60 z-[100] px-4 md:px-5 flex items-center justify-between">
        {/* Left */}
        <Link href="/" className="flex items-center gap-[6px] group cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
          <span className="hidden md:inline text-[13px] font-medium text-secondary group-hover:text-primary transition-colors">Dashboard</span>
        </Link>

        {/* Center */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <div className="flex items-center gap-[6px]">
            {saveState === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 text-tertiary animate-spin" />
                <span className="text-[12px] text-tertiary">Saving...</span>
              </>
            )}
            {saveState === 'saved' && (
              <>
                <Check className="w-3 h-3 text-[#4caf50]" />
                <span className="text-[12px] text-[#4caf50]">Saved</span>
              </>
            )}
            {saveState === 'error' && (
              <>
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-[12px] text-red-500">Save failed &mdash; retrying</span>
              </>
            )}
          </div>
          <div className="hidden md:block w-px h-4 bg-border mx-3" />
          <div className="hidden md:block text-[13px] text-tertiary max-w-[280px] truncate">
            {title || <span className="italic">Untitled post</span>}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-row items-center gap-2">
          <button className="h-8 px-3 md:px-[14px] border border-border rounded-[5px] text-[13px] font-medium text-primary bg-transparent hover:bg-subtle transition-colors">
            <span className="hidden md:inline">Save draft</span>
            <span className="md:hidden">Draft</span>
          </button>
          <button className="h-8 px-3 md:px-[14px] rounded-[5px] text-[13px] font-semibold bg-brand text-brand-foreground hover:opacity-85 transition-opacity">
            Publish
          </button>
        </div>
      </header>

      {/* Scrollable Writing Area */}
      <main className="flex-1 w-full pt-12 pb-[44px] md:pb-[44px] overflow-y-auto">
        <div className="max-w-[760px] mx-auto w-full px-4 md:px-6 pt-6 md:pt-8 pb-32">

          {/* Writing Canvas */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="md:bg-background/40 md:backdrop-blur-[20px] md:border md:border-border/60 md:rounded-[12px] md:shadow-2xl dark:shadow-purple-900/5 md:pt-12 md:pb-16 px-0 md:px-12 relative isolate overflow-hidden"
          >
            {/* Subtle top glare */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />

            {/* Toolbar (Floating) */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="sticky top-16 md:-mt-16 bg-background/80 backdrop-blur-xl border border-border/60 shadow-lg shadow-black/5 dark:shadow-black/20 rounded-full flex flex-wrap items-center gap-[4px] px-3 py-1.5 w-max mx-auto select-none overflow-x-auto scroller-hide mb-8 z-50 transition-all hover:bg-background/95 hover:border-accent/30 hover:shadow-accent/5"
            >

              {/* Group 1 */}
              <div className="flex items-center">
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-primary bg-subtle/70 transition-colors" title="Bold">
                  <span className="font-bold text-[15px] font-serif leading-none mt-1">B</span>
                </button>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors" title="Italic">
                  <span className="italic text-[15px] font-serif leading-none mt-1">I</span>
                </button>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors line-through" title="Strikethrough">
                  <span className="text-[14px] leading-none">S</span>
                </button>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors" title="Inline code">
                  <code className="text-[14px] font-mono leading-none">&lt;/&gt;</code>
                </button>
              </div>

              <div className="w-px h-4 bg-border mx-1 shrink-0" />

              {/* Group 2 */}
              <div className="flex items-center">
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-primary bg-subtle/70 transition-colors" title="Heading 2">
                  <span className="font-bold text-[13px] leading-none">H<sub className="text-[9px]">2</sub></span>
                </button>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors" title="Heading 3">
                  <span className="font-bold text-[13px] leading-none">H<sub className="text-[9px]">3</sub></span>
                </button>
                <button className="hidden sm:flex w-[30px] h-[30px] items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors" title="Heading 4">
                  <span className="font-bold text-[13px] leading-none">H<sub className="text-[9px]">4</sub></span>
                </button>
              </div>

              <div className="w-px h-4 bg-border mx-1 shrink-0" />

              {/* Group 3 */}
              <div className="hidden sm:flex items-center">
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors">
                  <span className="text-[16px] leading-none">&bull;</span>
                </button>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors">
                  <span className="text-[14px] leading-none font-mono">1.</span>
                </button>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors" title="Blockquote">
                  <span className="text-[18px] leading-none font-serif">&rdquo;</span>
                </button>
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors">
                  <span className="text-[14px] leading-none">&mdash;</span>
                </button>
              </div>

              <div className="hidden sm:block w-px h-4 bg-border mx-1 shrink-0" />

              {/* Group 4 */}
              <div className="flex items-center">
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors">
                  <ImageIcon className="w-[15px] h-[15px]" />
                </button>
                <button className="hidden sm:flex w-[30px] h-[30px] items-center justify-center rounded-[5px] text-secondary hover:text-primary hover:bg-subtle transition-colors">
                  <Video className="w-[15px] h-[15px]" />
                </button>
              </div>

              {/* overflow indicator for mobile */}
              <div className="sm:hidden flex items-center ml-auto">
                <button className="w-[30px] h-[30px] flex items-center justify-center rounded-[5px] text-secondary">
                  <span className="tracking-widest leading-none">&middot;&middot;&middot;</span>
                </button>
              </div>
            </motion.div>

            {/* Title & Excerpt Areas */}
            <div className="flex flex-col">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Post title..."
                className="w-full bg-transparent text-primary text-[22px] md:text-[28px] font-bold leading-[1.2] outline-none placeholder:text-tertiary placeholder:font-normal py-2 mb-2"
              />
              <textarea
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Short excerpt (optional)..."
                className="w-full bg-transparent text-secondary text-[15px] font-normal leading-[1.5] outline-none placeholder:text-tertiary resize-none overflow-hidden h-12 pb-4"
              />
            </div>

            <div className="w-full h-px bg-border my-1 mb-6" />

            {/* Tiptap Editor Content Area (Simulated) */}
            <div className="min-h-[400px] w-full isolate text-primary font-serif text-[16px] md:text-[17px] leading-[1.65]">

              <h2 className="font-sans text-[22px] font-bold mt-[2.5em] mb-[0.6em] text-primary outline-none">
                The Architecture of Silence
              </h2>

              <p className="mb-[1.2em] outline-none relative">
                Most anime sound design works by filling every moment. Fight scenes are dense with impact sounds, whooshes, and musical punctuation. The silence between hits exists only as breath before the next sound event.
              </p>

              <p className="mb-[1.2em] outline-none">
                Chainsaw Man director Ryuu Nakayama made a radical decision with sound designer Tatsuya Yamamoto: the moments of most extreme violence would often carry the least sound. The scene in episode three where<span className="relative before:absolute before:inset-y-0 before:-ml-px before:left-full before:w-[2px] before:bg-accent before:animate-pulse"></span>...
              </p>

              <blockquote className="my-[2em] border-l-[3px] border-border-strong bg-subtle rounded-r-[4px] py-4 px-5 outline-none">
                <p className="font-serif italic text-[16px] leading-[1.7] text-secondary mb-3">
                  &quot;We wanted the audience to feel what silence sounds like after something terrible. Not dramatic silence &mdash; accidental silence. The sound of shock.&quot;
                </p>
                <footer className="text-[12px] font-sans text-tertiary">
                  &mdash; Tatsuya Yamamoto, sound designer
                </footer>
              </blockquote>

              <p className="mb-[1.2em] outline-none">
                This philosophy extends to the musical score by Kensuke Ushio, who is best known for his ambient work on A Silent Voice and Devilman Crybaby. Where those scores used silence as meditation, Chainsaw Man uses it as threat.
              </p>

              <div className="my-[2em] w-[calc(100%+32px)] -mx-4 md:w-full md:mx-0 outline-none">
                <div className="relative w-full aspect-video md:rounded-[4px] overflow-hidden bg-[#111]">
                  <Image
                    src="https://picsum.photos/seed/csm/1280/720"
                    alt="Inline"
                    fill
                    className="object-cover opacity-90 saturate-50 contrast-125"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="mt-2 text-center text-[12px] font-sans italic text-tertiary px-4 md:px-0">
                  Episode 3, the confrontation scene. Note the complete absence of score during this 47-second sequence.
                </div>
              </div>

              <h3 className="font-sans text-[17px] font-semibold mt-[2em] mb-[0.4em] text-primary outline-none">
                The Impact Sound Philosophy
              </h3>

              <p className="mb-[1.2em] outline-none text-tertiary opacity-50">
                Start writing here...
              </p>

            </div>

          </motion.div>

          <div className="mt-4 text-[11px] text-tertiary text-right px-2 md:px-0 font-sans tracking-wide">
            3,847 characters
          </div>

        </div>
      </main>

      {/* Post Settings Bar (Fixed Bottom) */}
      <div className={`fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-xl border-t border-border/60 z-50 flex flex-col transition-all duration-[400ms] cubic-bezier(0.16, 1, 0.3, 1) shadow-[0_-10px_50px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_50px_-10px_rgba(0,0,0,0.3)] ${isSettingsExpanded ? 'h-[100dvh] md:h-auto md:max-h-[85vh] overflow-y-auto' : 'h-[44px]'}`}>

        {/* Toggle Bar */}
        <button
          onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
          className={`h-[44px] w-full flex items-center justify-center gap-2 group shrink-0 ${isSettingsExpanded ? 'border-b border-border' : 'hover:bg-subtle transition-colors'}`}
        >
          {isSettingsExpanded ? (
            <ChevronDown className="w-[13px] h-[13px] text-tertiary group-hover:text-secondary" />
          ) : (
            <ChevronUp className="w-[13px] h-[13px] text-tertiary group-hover:text-secondary" />
          )}
          <span className="text-[12px] text-tertiary group-hover:text-secondary transition-colors">
             {isSettingsExpanded ? 'Close settings' : 'Post settings — cover, category, tags, co-authors'}
          </span>
        </button>

        {/* Expanded Content View */}
        {isSettingsExpanded && (
          <div className="w-full max-w-[760px] mx-auto px-5 md:px-[24px] py-6 md:py-8 flex flex-col md:flex-row gap-8 md:gap-10">

            {/* Left Column */}
            <div className="flex-[1.2] flex flex-col">
              <label className="text-[12px] font-semibold text-secondary mb-[10px]">Cover image</label>

              {!hasCoverImage ? (
                <button
                    onClick={() => setHasCoverImage(true)}
                    className="w-full aspect-video rounded-[8px] bg-subtle border-[1.5px] border-dashed border-border-strong flex flex-col items-center justify-center hover:bg-subtle/80 hover:border-secondary transition-all group"
                >
                  <ImageIcon className="w-6 h-6 text-tertiary mb-2 group-hover:text-secondary transition-colors" />
                  <span className="text-[13px] text-secondary">Add cover image</span>
                  <span className="text-[11px] text-tertiary mt-1">JPG, PNG, GIF, WebP &middot; Max 10MB</span>
                </button>
              ) : (
                <div className="relative w-full aspect-video rounded-[8px] overflow-hidden group">
                  <Image src="https://picsum.photos/seed/cover/1280/720" fill alt="Cover" className="object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <div className="flex flex-col items-center text-white">
                      <ImageIcon className="w-6 h-6 mb-2" />
                      <span className="text-[13px] font-medium">Change</span>
                    </div>
                  </div>
                  <button onClick={() => setHasCoverImage(false)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 text-white flex justify-center items-center hover:bg-black/80 transition-colors">
                    <X className="w-[14px] h-[14px]" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="flex-[1] flex flex-col gap-6">

              <div className="flex flex-col">
                <label className="text-[12px] font-semibold text-secondary mb-[8px]">Category</label>
                <div className="relative">
                  <select className="w-full h-[36px] bg-transparent border border-border rounded-[5px] px-2 text-[13px] outline-none focus:border-accent appearance-none cursor-pointer">
                    <option value="animation">Animation Analysis</option>
                    <option value="narrative">Narrative Analysis</option>
                    <option value="review">Review</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-[11px] w-3 h-3 text-secondary pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[12px] font-semibold text-secondary mb-[8px]">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Chainsaw Man', 'Sound Design', 'MAPPA'].map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-subtle text-primary border border-border px-3 py-1 rounded-full text-[13px] font-medium">
                      {tag}
                      <X className="w-3 h-3 text-secondary cursor-pointer hover:text-accent ml-[2px]" />
                    </span>
                  ))}
                </div>
                <input type="text" placeholder="Search or create tags..." className="w-full h-[34px] bg-transparent border border-border rounded-[5px] px-[10px] text-[13px] outline-none focus:border-accent placeholder:text-tertiary" />
                {/* Example dropdown simulation */}
                <div className="mt-1 bg-background border border-border rounded-[5px] py-1 shadow-sm flex flex-col max-h-32 overflow-y-auto">
                   <div className="px-3 py-[6px] text-[13px] hover:bg-subtle cursor-pointer transition-colors"><span className="text-secondary">#</span> Seinen</div>
                   <div className="px-3 py-[6px] text-[13px] hover:bg-subtle cursor-pointer transition-colors"><span className="text-secondary">#</span> <span className="bg-accent/20 text-accent">Action</span></div>
                   <div className="px-3 py-[6px] text-[13px] hover:bg-subtle cursor-pointer transition-colors"><span className="text-secondary">#</span> 2022 Fall</div>
                   <div className="px-3 py-[6px] text-[13px] hover:bg-subtle cursor-pointer transition-colors"><span className="text-secondary">#</span> Kensuke Ushio</div>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[12px] font-semibold text-secondary mb-[8px]">Co-authors</label>
                <div className="flex items-center gap-2 mb-2 bg-subtle border border-border px-2 py-1.5 rounded-[5px] w-max">
                  <div className="w-[20px] h-[20px] rounded-full bg-[#7b5ea7] flex justify-center items-center text-white text-[10px] font-bold">Y</div>
                  <span className="text-[13px] font-medium">Yuki Ishikawa</span>
                  <X className="w-3 h-3 text-secondary cursor-pointer hover:text-accent ml-2" />
                </div>
                <input type="text" placeholder="Add co-author..." className="w-full h-[34px] bg-transparent border border-border rounded-[5px] px-[10px] text-[13px] outline-none focus:border-accent placeholder:text-tertiary" />
              </div>

              <div className="flex flex-col">
                <label className="text-[12px] font-semibold text-secondary mb-[8px]">Draft visibility</label>
                <div className="flex w-full overflow-hidden border border-border rounded-[5px]">
                   <button className="flex-1 h-[32px] bg-brand text-brand-foreground text-[12px] font-semibold flex items-center justify-center gap-1.5">
                     🔒 Private
                   </button>
                   <button className="flex-1 h-[32px] bg-transparent text-primary text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-subtle transition-colors border-l border-border">
                     👥 Visible to co-authors
                   </button>
                </div>
                <p className="text-[11px] italic text-tertiary mt-2">Only you and admins can see this draft.</p>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}
