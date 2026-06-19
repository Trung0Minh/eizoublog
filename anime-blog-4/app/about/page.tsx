import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Sparkles, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col pt-0">
      <Navbar />

      <main className="flex-1 w-full max-w-[1000px] mx-auto px-5 pt-8 md:pt-16 pb-20">
        <div className="bg-subtle/80 backdrop-blur-sm border-[3px] border-border/60 rounded-[24px] p-6 md:p-12 shadow-xl relative overflow-hidden">
          {/* Decorative Corner Flairs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-tr-[100px] -z-10" />

          <div className="flex flex-col md:flex-row gap-10 items-center">

            <div className="w-full md:w-[40%] relative aspect-[3/4] rounded-[16px] overflow-hidden border-4 border-white dark:border-border-strong shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
               <Image
                  src="https://picsum.photos/seed/animekawaiigirl/800/1000"
                  alt="Mascot"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
               />
               {/* Cute sticker overlay */}
               <div className="absolute -bottom-4 -right-4 bg-accent text-white w-16 h-16 rounded-full flex items-center justify-center font-display font-bold shadow-md rotate-12">
                 Hi!
               </div>
            </div>

            <div className="w-full md:w-[60%] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-accent animate-pulse" />
                <h1 className="text-[32px] md:text-[42px] font-display font-bold text-primary leading-tight">
                  Welcome to <span className="text-accent">Anime Blog!</span>
                </h1>
              </div>

              <div className="space-y-4 text-[16px] text-secondary font-sans">
                <p>
                  This blog is a passion project dedicated to deep-diving into the world of Japanese animation! We believe that anime is more than just entertainment; it&apos;s an art form rich with incredible direction, brilliant compositing, and emotional storytelling.
                </p>
                <p>
                  Our team of writers loves to break down Sakuga moments, analyze narrative structures, and appreciate the meticulous hard work of animators and directors from various studios like Kyoto Animation, Madhouse, MAPPA, and Ufotable.
                </p>

                <div className="bg-background/60 p-4 rounded-xl border border-border mt-6">
                  <h3 className="font-display font-bold text-primary flex items-center gap-2 text-[18px] mb-2">
                    <Heart className="w-5 h-5 text-accent" /> Why we do this
                  </h3>
                  <p className="text-[14px]">
                    To spread the love for animation and give credit to the incredible creators who bring our favorite worlds to life. We want to be a place where fans can read thought-provoking essays with a cup of tea in a cozy, cute environment! 💖
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
