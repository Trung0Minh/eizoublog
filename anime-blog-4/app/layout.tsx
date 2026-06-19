import type {Metadata} from 'next';
import { Nunito, Lora, M_PLUS_Rounded_1c } from 'next/font/google';
import './globals.css';
import { SeasonalEffects } from '@/components/SakuraFalling';
import { BackToTop } from '@/components/BackToTop';
import { ReadingProgress } from '@/components/ReadingProgress';
import { CustomCursor } from '@/components/CustomCursor';
import { NoiseOverlay } from '@/components/NoiseOverlay';
import { AmbientBackground } from '@/components/AmbientBackground';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-sans',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
});

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ['400', '500', '700', '800'],
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Anime Blog',
  description: 'An editorial-style anime analysis and review blog.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${nunito.variable} ${lora.variable} ${mPlusRounded.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }

                let season = localStorage.getItem('season');
                if (!season) {
                  let month = new Date().getMonth();
                  if (month >= 2 && month <= 4) season = 'spring';
                  else if (month >= 5 && month <= 7) season = 'summer';
                  else if (month >= 8 && month <= 10) season = 'autumn';
                  else season = 'winter';
                }
                document.documentElement.setAttribute('data-season', season);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-background text-primary font-sans antialiased selection:bg-accent/30 selection:text-accent" suppressHydrationWarning>
        <AmbientBackground />
        <NoiseOverlay />
        <CustomCursor />
        <ReadingProgress />
        <div className="star-bg"></div>
        <SeasonalEffects />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
