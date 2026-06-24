import type { Metadata } from "next"
import { Nunito, M_PLUS_Rounded_1c } from "next/font/google"
import { Suspense } from "react"

import { InternalAnalyticsTracker } from "@/components/analytics/InternalAnalyticsTracker"
import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { NavbarWrapper } from "@/components/layout/NavbarWrapper"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { DEFAULT_DESCRIPTION, getAppName, getAppUrl } from "@/lib/seo"

import { BackToTop } from "@/components/ui/BackToTop"
import { GlobalEffects } from "@/components/ui/GlobalEffects"
import { DynamicBackground } from "@/components/ui/DynamicBackground"
import { getCustomBackgrounds } from "@/lib/backgrounds"
import { Toaster } from "@/components/ui/Toaster"
import { CommandMenu } from "@/components/ui/CommandMenu"
import { CursorSpotlight } from "@/components/ui/CursorSpotlight"

import "./globals.css"

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter", // Keep this variable name so tailwind config still works, or update tailwind config.
})


const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ['700', '800'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: {
    default: getAppName(),
    template: `%s | ${getAppName()}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(getAppUrl()),
  openGraph: {
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        alt: "Eizou Blog",
        height: 630,
        url: "/og-default.png",
        width: 1200,
      },
    ],
    locale: "vi_VN",
    siteName: getAppName(),
    title: getAppName(),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description: DEFAULT_DESCRIPTION,
    images: ["/og-default.png"],
    title: getAppName(),
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const customBackgrounds = await getCustomBackgrounds()
  return (
    <html
      lang="vi"
      className={`${nunito.variable} ${mPlusRounded.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Mock system dark mode to use Vietnam time (UTC+7)
                const originalMatchMedia = window.matchMedia;
                let darkThemeListeners = [];
                let lastIsDark = null;

                function getVietnamIsDark() {
                  const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
                  const nd = new Date(utc + (3600000 * 7));
                  const hour = nd.getHours();
                  return hour < 6 || hour >= 18;
                }

                window.matchMedia = function(query) {
                  if (query === '(prefers-color-scheme: dark)') {
                    lastIsDark = getVietnamIsDark();
                    const mql = {
                      get matches() { return getVietnamIsDark(); },
                      media: query,
                      onchange: null,
                      addListener: function(fn) { darkThemeListeners.push(fn); },
                      removeListener: function(fn) { darkThemeListeners = darkThemeListeners.filter(l => l !== fn); },
                      addEventListener: function(_, fn) { darkThemeListeners.push(fn); },
                      removeEventListener: function(_, fn) { darkThemeListeners = darkThemeListeners.filter(l => l !== fn); },
                      dispatchEvent: function() { return true; }
                    };
                    return mql;
                  }
                  return originalMatchMedia(query);
                };

                setInterval(() => {
                  if (lastIsDark === null) return;
                  const currentIsDark = getVietnamIsDark();
                  if (currentIsDark !== lastIsDark) {
                    lastIsDark = currentIsDark;
                    darkThemeListeners.forEach(fn => fn({ matches: currentIsDark }));
                  }
                }, 60000);

                let season = localStorage.getItem('season');
                if (!season) {
                  let month = new Date().getMonth();
                  if (month >= 2 && month <= 4) season = 'spring';
                  else if (month >= 5 && month <= 7) season = 'summer';
                  else if (month >= 8 && month <= 10) season = 'autumn';
                  else season = 'winter';
                }
                document.documentElement.setAttribute('data-season', season);

                let particles = document.cookie
                  .split('; ')
                  .find((entry) => entry.indexOf('particleEffects=') === 0)
                  ?.split('=')[1];
                if (particles !== 'on' && particles !== 'off') {
                  particles = window.matchMedia('(pointer: coarse)').matches ? 'off' : 'on';
                }
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                  particles = 'off';
                }
                document.documentElement.setAttribute('data-particles', particles);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans bg-transparent text-text-primary antialiased selection:bg-accent/30 selection:text-accent">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <DynamicBackground customBackgrounds={customBackgrounds} />
          <GlobalEffects />
          <CursorSpotlight />
          <div className="flex min-h-screen flex-col relative z-10">
            <NavbarWrapper>
              <Navbar />
            </NavbarWrapper>
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
          <BackToTop />
        </ThemeProvider>
        <Suspense fallback={null}>
          <InternalAnalyticsTracker />
        </Suspense>
        <Toaster />
        <CommandMenu />
      </body>
    </html>
  )
}
