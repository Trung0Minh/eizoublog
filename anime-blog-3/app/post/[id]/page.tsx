'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Sparkles } from 'lucide-react';
import { useParams } from 'next/navigation';
import { POSTS } from '@/lib/posts';

export default function PostDetail() {
  const params = useParams();
  const id = Number(params?.id) || 1;
  const post = POSTS.find(p => p.id === id) || POSTS[0];

  const [activeTocId, setActiveTocId] = useState('problem');
  const [isReplyOpen, setIsReplyOpen] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 800) setActiveTocId('problem');
      else if (scrollY >= 800 && scrollY < 1200) setActiveTocId('reframes');
      else if (scrollY >= 1200 && scrollY < 1500) setActiveTocId('metaphors');
      else if (scrollY >= 1500) setActiveTocId('matters');
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleReply = (id: string) => {
    setIsReplyOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
      <div className="min-h-screen flex flex-col pt-0">
        <Navbar />

        {/* Hero Cover Image for the Post */}
        <div className="w-full h-[40vh] md:h-[60vh] lg:h-[70vh] relative">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end pb-8 md:pb-16 px-5 xl:px-12">
            <div className="max-w-[720px] mx-auto w-full">
              <div className="text-[11px] font-bold text-white bg-accent px-3 py-1 rounded-full uppercase tracking-[0.1em] w-max mb-4 shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3"/> {post.category}
              </div>
              <h1 className="text-[28px] md:text-[44px] lg:text-[52px] font-display font-bold text-primary leading-[1.1] tracking-[-0.02em] drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] mb-6">
                {post.title}
              </h1>

              <div className="flex items-center gap-[12px] bg-background/95 backdrop-blur-md w-max p-2 pr-4 rounded-full border border-border shadow-md select-none">
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-[#2d6e7e] flex justify-center items-center text-white text-[14px] outline outline-2 outline-background z-10 font-bold">
                    {post.authorInitials}
                  </div>
                  {post.coAuthorInitials && (
                    <div className="w-9 h-9 rounded-full bg-[#c47f5a] flex justify-center items-center text-white text-[14px] outline outline-2 outline-background -ml-[12px] z-20 font-bold">
                      {post.coAuthorInitials}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center text-[13px] text-primary font-bold">
                  <div className="flex items-center gap-1">
                    <span className="text-primary hover:text-accent font-bold">{post.author}</span>
                    {post.coAuthor && (
                      <>
                        <span className="text-secondary font-medium">&amp;</span>
                        <span className="text-primary hover:text-accent font-bold">{post.coAuthor}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center text-secondary hidden sm:flex mx-2">&middot;</div>
                  <div className="flex items-center text-secondary font-medium">
                    <span>{post.date}</span>
                    <span className="mx-2">&middot;</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout containing Article and optional TOC */}
        <div className="flex-1 w-full max-w-[1440px] mx-auto xl:px-12 flex justify-center pt-8 pb-20 relative">

          <main className="w-full max-w-[720px] px-5 xl:px-0">
            {/* Header Section (Continuing below hero) */}
            <header className="flex flex-col">
              <div className="text-right text-[11px] text-tertiary italic mb-4">
                &copy; Madhouse / Frieren: Beyond Journey&apos;s End, Episode 4
              </div>

              <div className="flex flex-wrap gap-[6px]">
                {['Frieren', 'Animation Analysis', 'Madhouse', '2023 Fall', 'Seinen'].map(tag => (
                  <span key={tag} className="px-[12px] py-[6px] bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold rounded-full hover:bg-accent hover:text-white transition-colors cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </header>

            {/* Article Body */}
            <article className="mt-12 max-w-[68ch] mx-auto text-primary font-serif text-[16px] md:text-[17.5px] leading-[1.75] md:leading-[1.8]">

              <p className="mb-[1.2em]">
                What makes Frieren so visually striking is not any single technical achievement, but rather a sustained philosophy about what anime can communicate without dialogue. Director Atsushi Ookubo and animation supervisor Reiko Nagasawa have built a visual language around negative space &mdash; the emptiness between characters, the pause before a spell is cast, the moment after it resolves.
              </p>

              <p className="mb-[1.2em]">
                In most action-oriented fantasy anime, magic functions as a visual spectacle. Explosions, light beams, elaborate transformation sequences. The audience measures quality by density &mdash; how much is happening per second. Frieren inverts this entirely. Its most significant magical moments are often the quietest ones. A flower blooming in an instant. A flame dying on a fingertip. The choice to show these events at a pace that respects their duration rather than dramatizing them is, in itself, a directorial statement.
              </p>

              <h2 id="problem" className="font-sans text-[22px] font-bold mt-[2.5em] mb-[0.6em] text-primary border-l-[3px] border-accent pl-[14px]">
                The Problem with Conventional Anime Pacing
              </h2>

              <p className="mb-[1.2em]">
                This approach descends directly from Yoshiyuki Tomino&apos;s work on early Gundam, filtered through the quieter sensibilities of Satoshi Kon and later Masaaki Yuasa. What Ookubo adds is a kind of temporal honesty &mdash; a willingness to let real time pass on screen without filling it with incident. It is an act of trust in the audience, and in the medium itself.
              </p>

              <div className="my-[2em] -mx-5 md:mx-0 w-[calc(100%+40px)] md:w-full">
                <div className="relative w-full aspect-video rounded-none md:rounded-[4px] overflow-hidden bg-subtle">
                   <Image
                    src="https://picsum.photos/seed/comp1/1280/720"
                    alt="Inline"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="mt-2 text-center text-[12px] font-sans italic text-tertiary px-5 md:px-0">
                  Key animation frame (left) vs. final composite (right) &mdash; Episode 4, cut 47. Animation by Reiko Nagasawa.
                </div>
              </div>

              <h3 id="reframes" className="font-sans text-[17px] font-semibold mt-[2em] mb-[0.4em] text-primary">
                How Frieren Reframes Time
              </h3>

              <p className="mb-[1.2em]">
                When we analyze the visual structure, we can see exactly where the production decisions map to the narrative ones.
              </p>

              <blockquote className="my-[2em] border-l-[3px] border-border-strong bg-subtle rounded-r-[4px] py-4 px-4 md:px-5 mx-[16px] md:mx-0">
                <p className="font-serif italic text-[16px] leading-[1.7] text-secondary mb-3">
                  &quot;Animation is not about drawing things that move. It is about drawing the space between movements &mdash; the invisible architecture of time itself. Frieren understands this in a way few productions have.&quot;
                </p>
                <footer className="text-[12px] font-sans font-normal text-tertiary">
                  &mdash; Sakuga Database editorial, November 2023
                </footer>
              </blockquote>

              <p className="mb-[1.2em]">
                This is particularly evident in how scenes are structured timeline-wise. Consider the breakdown of Episode 4:
              </p>

              <div className="my-[2em] bg-subtle border border-border rounded-[6px] p-4 md:p-5 mx-[16px] md:mx-0 overflow-x-auto">
                <pre className="font-mono text-[13px] leading-[1.6] text-primary">
{`Episode 01 — "Sunrise Castle"
  Director: Atsushi Ookubo
  Animation Director: Reiko Nagasawa
  Key Animation: Takashi Kojima, Sayo Yamamoto
  Notable cuts: 14, 47, 103

Episode 04 — "The First Step"  ← high sakuga density
  Director: Atsushi Ookubo
  Animation Director: Reiko Nagasawa, Taro Ikegami
  Key Animation: Nana Yamazaki, Hiroshi Seko (9 cuts)
  Notable cuts: 8, 22, 55, 78, 91`}
                </pre>
              </div>

              <h2 id="metaphors" className="font-sans text-[22px] font-bold mt-[2.5em] mb-[0.6em] text-primary border-l-[3px] border-accent pl-[14px]">
                Visual Metaphors and the Magic System
              </h2>

              <p className="mb-[1.2em]">
                Another striking element is the implementation of smear frames...
              </p>

              <div className="my-[2em] -mx-5 md:mx-0 w-[calc(100%+40px)] md:w-full">
                <div className="relative w-full aspect-[2.35/1] rounded-none md:rounded-[4px] overflow-hidden bg-subtle">
                  <Image
                    src="https://picsum.photos/seed/comp2/1280/544"
                    alt="Smear Frame"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="mt-2 text-center text-[12px] font-sans italic text-tertiary px-5 md:px-0">
                  A smear frame from episode 28&apos;s climactic sequence. The distortion here is intentional &mdash; note how the arm extends beyond anatomical possibility to communicate velocity.
                </div>
              </div>

              <hr className="w-[40%] mx-auto my-[2.5em] border-t border-border" />

              <h2 id="matters" className="font-sans text-[22px] font-bold mt-[2.5em] mb-[0.6em] text-primary border-l-[3px] border-accent pl-[14px]">
                Why This Matters for the Medium
              </h2>

              <p className="mb-[1.2em]">
                Ultimately, Frieren represents a maturation of fantasy anime. It proves that there is an audience hungry for restraint, for stories that breathe, for animation that doesn&apos;t shout when it can whisper.
              </p>

              <p className="mb-[1.2em]">
                As we look ahead to future seasons, the precedent set here by Madhouse will likely ripple outward, perhaps signaling a new era for thoughtful, atmospheric television animation.
              </p>

            </article>

            {/* Author Bio Section */}
            <div className="mt-12 pt-10 border-t border-border flex flex-col md:flex-row items-center md:items-start gap-5 bg-subtle rounded-[8px] p-6 border-x border-b">
              <div className="w-[56px] h-[56px] shrink-0 rounded-full bg-[#2d6e7e] flex justify-center items-center text-white text-[24px] font-medium">
                {post.authorInitials}
              </div>
              <div className="flex flex-col text-center md:text-left">
                <div className="text-[11px] font-sans font-semibold uppercase text-tertiary tracking-[0.08em] mb-1">Written by</div>
                <Link href="#" className="text-[16px] font-sans font-bold text-primary hover:underline group inline-flex items-center mx-auto md:mx-0">
                  {post.author}
                </Link>
                <p className="mt-2 text-[13px] font-sans text-secondary leading-[1.6]">
                  {post.authorBio}
                </p>
                <Link href="#" className="mt-3 text-[13px] font-sans text-accent hover:underline inline-block">
                  View all posts &rarr;
                </Link>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-12">
              <h2 className="text-[20px] font-sans font-bold text-primary mb-2">Comments</h2>
              <div className="text-[14px] font-sans text-secondary mb-6">24 comments</div>

              {/* Comment Form */}
              <div className="mb-10 w-full">
                <div className="text-[14px] font-sans font-semibold text-primary mb-4">Leave a comment</div>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1 flex flex-col">
                    <label className="text-[13px] font-sans text-secondary mb-[6px]">Name *</label>
                    <input type="text" className="w-full h-[40px] px-3 border border-border rounded-[5px] text-[14px] font-sans bg-transparent text-primary focus:outline-none focus:border-accent" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-[13px] font-sans text-secondary mb-[6px]">Email *</label>
                    <input type="email" className="w-full h-[40px] px-3 border border-border rounded-[5px] text-[14px] font-sans bg-transparent text-primary focus:outline-none focus:border-accent" />
                    <div className="text-[11px] font-sans text-tertiary mt-1">Not shown publicly</div>
                  </div>
                </div>
                <div className="flex flex-col mb-4">
                  <label className="text-[13px] font-sans text-secondary mb-[6px]">Comment *</label>
                  <textarea className="w-full h-[120px] p-3 border border-border rounded-[5px] text-[14px] font-sans bg-transparent text-primary resize-y focus:outline-none focus:border-accent"></textarea>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <input type="checkbox" id="notify" className="rounded-sm border-border accent-brand" />
                  <label htmlFor="notify" className="text-[13px] font-sans text-secondary">Notify me by email when someone replies</label>
                </div>
                <div className="flex justify-end">
                  <button className="h-[38px] px-5 bg-brand text-brand-foreground font-sans text-[13px] font-semibold rounded-[5px] hover:opacity-90 transition-opacity">
                    Post comment
                  </button>
                </div>
              </div>

              {/* Comment List */}
              <div className="flex flex-col gap-6">

                {/* Comment 1 */}
                <div className="flex flex-col relative w-full">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4a6fa5] flex justify-center items-center text-white text-[14px] font-bold shrink-0">S</div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-sans font-semibold text-primary">Sora K.</span>
                        <span className="text-[12px] font-sans text-tertiary">2 hours ago</span>
                      </div>
                      <p className="text-[14px] font-sans text-secondary leading-[1.6] mt-1">
                        This is exactly the kind of analysis I&apos;ve been waiting for. The point about negative space is so important &mdash; I never had the vocabulary for it but I felt it in every episode.
                      </p>
                      <button onClick={() => toggleReply('c1')} className="mt-2 text-[12px] font-sans text-tertiary hover:text-primary self-start transition-colors">
                        Reply
                      </button>

                      {isReplyOpen['c1'] && (
                        <div className="mt-3 flex flex-col w-full">
                          <textarea className="w-full h-20 p-2 border border-border rounded-md text-[13px] bg-transparent text-primary resize-none focus:outline-none focus:border-accent" placeholder="Write a reply..."></textarea>
                          <div className="flex justify-end mt-2">
                            <button className="h-[30px] px-3 bg-brand text-brand-foreground font-sans text-[12px] font-medium rounded hover:opacity-90">Post reply</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reply to Comment 1 */}
                  <div className="ml-5 pl-5 md:ml-10 mt-6 flex gap-3 border-l border-border relative">
                    <div className="w-[28px] h-[28px] rounded-full bg-[#4a7c59] flex justify-center items-center text-white text-[12px] font-bold shrink-0">R</div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-sans font-semibold text-primary">Ren F.</span>
                        <span className="text-[12px] font-sans text-tertiary">1 hour ago</span>
                      </div>
                      <p className="text-[14px] font-sans text-secondary leading-[1.6] mt-1">
                        The comparison to Tomino is interesting but I&apos;d push back slightly &mdash; Ookubo&apos;s sensibility feels more specifically indebted to Dezaki than early Gundam. The postcard memory effect appears twice in episode 3 alone.
                      </p>
                      <button className="mt-2 text-[12px] font-sans text-tertiary hover:text-primary self-start transition-colors">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment 2 */}
                <div className="flex gap-3 mt-4">
                  <div className="w-8 h-8 rounded-full bg-[#7b5ea7] flex justify-center items-center text-white text-[14px] font-bold shrink-0">Y</div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-sans font-semibold text-primary">Yuki I.</span>
                      <span className="text-[12px] font-sans text-tertiary">Yesterday</span>
                    </div>
                    <p className="text-[14px] font-sans text-secondary leading-[1.6] mt-1">
                      Beautifully written. One addition worth mentioning &mdash; the sound design complements this perfectly. Every silence in Frieren is acoustically shaped, not just the absence of sound.
                    </p>
                    <button className="mt-2 text-[12px] font-sans text-tertiary hover:text-primary self-start transition-colors">
                      Reply
                    </button>
                  </div>
                </div>

                {/* Comment 3 */}
                <div className="flex flex-col relative w-full mt-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#c47f5a] flex justify-center items-center text-white text-[14px] font-bold shrink-0">M</div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-sans font-semibold text-primary">Mei Y.</span>
                        <span className="text-[12px] font-sans text-tertiary">3 days ago</span>
                      </div>
                      <p className="text-[14px] font-sans text-secondary leading-[1.6] mt-1">
                        As someone who worked in animation production briefly, the analysis of the key animation credits in episode 4 is spot-on. What you didn&apos;t mention is that several of those cuts were done on 3s rather than 2s &mdash; which paradoxically makes them feel more fluid, not less.
                      </p>
                      <button onClick={() => toggleReply('c3')} className="mt-2 text-[12px] font-sans text-tertiary hover:text-primary self-start transition-colors">
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Repliy 1 */}
                  <div className="ml-5 pl-5 md:ml-10 mt-6 flex gap-3 border-l border-border relative">
                    <div className="w-[28px] h-[28px] rounded-full bg-[#2d6e7e] flex justify-center items-center text-white text-[12px] font-bold shrink-0">K</div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-sans font-semibold text-primary">K.T.</span>
                        <span className="text-[12px] font-sans text-tertiary">2 days ago</span>
                      </div>
                      <p className="text-[14px] font-sans text-secondary leading-[1.6] mt-1">
                        This is a great point. Animating on 3s requires much more deliberate planning per frame.
                      </p>
                    </div>
                  </div>

                  {/* Repliy 2 - Author */}
                  <div className="ml-5 pl-5 md:ml-10 mt-6 flex gap-3 border-l border-border relative">
                    <div className="w-[28px] h-[28px] rounded-full bg-[#2d6e7e] flex justify-center items-center text-white text-[12px] font-bold shrink-0">H</div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-sans font-semibold text-primary">Haruki Tanaka</span>
                        <span className="px-[6px] py-[1px] bg-accent/15 text-accent border border-accent/30 rounded-[3px] text-[10px] font-semibold uppercase tracking-wider">Author</span>
                        <span className="text-[12px] font-sans text-tertiary">Yesterday</span>
                      </div>
                      <p className="text-[14px] font-sans text-secondary leading-[1.6] mt-1">
                        Thank you Mei &mdash; you&apos;re completely right, I touched on it briefly but it deserved its own section. Consider this a preview of a follow-up piece specifically on frame rate decisions.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </main>

          {/* Table of Contents - Desktop Only (xl+) */}
          <aside className="hidden xl:block w-[200px] shrink-0 ml-[48px]">
            <div className="sticky top-[80px] flex flex-col">
              <span className="text-[10px] font-sans font-semibold text-tertiary uppercase tracking-[0.1em] mb-3">Contents</span>
              <nav className="flex flex-col relative w-full border-l border-border pl-[8px] space-y-[8px]">

                <Link href="#problem" className={`text-[13px] font-sans transition-colors duration-150 relative -ml-[9px] pl-[8px] ${activeTocId === 'problem' ? 'font-medium text-accent border-l-[2px] border-accent' : 'text-secondary hover:text-primary'} leading-tight`}>
                  The Problem with Conventional Anime Pacing
                </Link>

                <Link href="#reframes" className={`text-[13px] font-sans transition-colors duration-150 relative -ml-[9px] pl-[8px] ${activeTocId === 'reframes' ? 'font-medium text-accent border-l-[2px] border-accent' : 'text-secondary hover:text-primary'} leading-tight`}>
                  How Frieren Reframes Time
                </Link>
                <div className="flex flex-col space-y-[8px]">
                   <span className="text-[12px] font-sans text-tertiary hover:text-primary transition-colors cursor-pointer ml-[12px] leading-tight">The 10-Year Time Skip</span>
                   <span className="text-[12px] font-sans text-tertiary hover:text-primary transition-colors cursor-pointer ml-[12px] leading-tight">Silence as Storytelling</span>
                </div>

                <Link href="#metaphors" className={`text-[13px] font-sans transition-colors duration-150 relative -ml-[9px] pl-[8px] ${activeTocId === 'metaphors' ? 'font-medium text-accent border-l-[2px] border-accent' : 'text-secondary hover:text-primary'} leading-tight`}>
                  Visual Metaphors and the Magic System
                </Link>

                <span className="text-[13px] font-sans text-secondary hover:text-primary transition-colors cursor-pointer leading-tight">
                  Comparing Directorial Approaches
                </span>

                <Link href="#matters" className={`text-[13px] font-sans transition-colors duration-150 relative -ml-[9px] pl-[8px] ${activeTocId === 'matters' ? 'font-medium text-accent border-l-[2px] border-accent' : 'text-secondary hover:text-primary'} leading-tight`}>
                  Why This Matters for the Medium
                </Link>

              </nav>
            </div>
          </aside>

        </div>

        <Footer />
      </div>
  );
}
