import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Sparkles, Twitter, Github, Globe } from 'lucide-react';
import { TextReveal } from '@/components/TextReveal';

const CONTRIBUTORS = [
  {
    id: 1,
    name: 'Haruki Tanaka',
    avatar: 'https://picsum.photos/seed/haruki/400/400',
    role: 'Lead Writer',
    bio: 'Specializes in animation direction and the technical craft behind contemporary sakuga culture.',
    favoriteAnime: 'Mob Psycho 100, Frieren',
    socials: { twitter: '#', github: '#' }
  },
  {
    id: 2,
    name: 'Mei Yoshida',
    avatar: 'https://picsum.photos/seed/mei/400/400',
    role: 'Editor & Critic',
    bio: 'Focuses on narrative structures, framing, and color theory in modern fantasy and slice-of-life anime.',
    favoriteAnime: 'A Place Further Than the Universe',
    socials: { twitter: '#', website: '#' }
  },
  {
    id: 3,
    name: 'Sora K.',
    avatar: 'https://picsum.photos/seed/sora/400/400',
    role: 'Staff Writer',
    bio: 'Background artist turned essayist. Writes about environmental storytelling and layout design.',
    favoriteAnime: 'Vinland Saga, Aria',
    socials: { website: '#' }
  },
  {
    id: 4,
    name: 'Yuki Ishikawa',
    avatar: 'https://picsum.photos/seed/yuki/400/400',
    role: 'Sound Analyst',
    bio: 'Professional sound designer breaking down the audio magic of composers like Kensuke Ushio.',
    favoriteAnime: 'Chainsaw Man, Devilman Crybaby',
    socials: { twitter: '#' }
  }
];

export default function ContributorsPage() {
  return (
    <div className="min-h-screen flex flex-col pt-0">
      <Navbar />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 pt-8 md:pt-16 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
            <h1 className="text-[36px] md:text-[48px] font-display font-bold text-primary">
              <TextReveal text="Our Awesome Team!" />
            </h1>
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          </div>
          <p className="text-[16px] text-secondary max-w-2xl mx-auto">
            Meet the writers, analysts, and otakus who make Anime Blog possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {CONTRIBUTORS.map(person => (
            <div key={person.id} className="group bg-subtle/40 backdrop-blur-md transition-all duration-300 border border-border/50 hover:border-accent/40 rounded-[20px] p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] relative overflow-hidden">

              <div className="w-[120px] h-[120px] shrink-0 relative rounded-full overflow-hidden border-4 border-background shadow-md group-hover:scale-105 transition-transform">
                <Image
                  src={person.avatar}
                  alt={person.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1">
                <div className="inline-block bg-accent/10 text-accent text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                  {person.role}
                </div>
                <h2 className="text-[22px] font-display font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                  {person.name}
                </h2>
                <p className="text-[14px] text-secondary mb-4 line-clamp-3">
                  {person.bio}
                </p>
                <div className="bg-background/50 rounded-lg p-3 text-[12px] mb-4">
                  <span className="font-bold text-primary">Favorites:</span> <span className="text-secondary">{person.favoriteAnime}</span>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-3">
                  {person.socials.twitter && (
                    <Link href={person.socials.twitter} className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-tertiary hover:text-[#1DA1F2] hover:shadow-sm transition-all">
                      <Twitter className="w-4 h-4" />
                    </Link>
                  )}
                  {person.socials.github && (
                    <Link href={person.socials.github} className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-tertiary hover:text-primary hover:shadow-sm transition-all">
                      <Github className="w-4 h-4" />
                    </Link>
                  )}
                  {person.socials.website && (
                    <Link href={person.socials.website} className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-tertiary hover:text-accent hover:shadow-sm transition-all">
                      <Globe className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
