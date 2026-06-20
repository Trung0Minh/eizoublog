import type { Metadata } from "next"
import { Nunito, Lora, M_PLUS_Rounded_1c } from "next/font/google"
import { Suspense } from "react"

import { InternalAnalyticsTracker } from "@/components/analytics/InternalAnalyticsTracker"
import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { NavbarWrapper } from "@/components/layout/NavbarWrapper"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { DEFAULT_DESCRIPTION, getAppName, getAppUrl } from "@/lib/seo"

import { BackToTop } from "@/components/ui/BackToTop"
import { GlobalEffects } from "@/components/ui/GlobalEffects"

import "./globals.css"

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter", // Keep this variable name so tailwind config still works, or update tailwind config.
})

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-lora",
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
    locale: "vi_VN",
    siteName: getAppName(),
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      className={`${nunito.variable} ${lora.variable} ${mPlusRounded.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
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
      <body className="min-h-screen font-sans bg-background text-text-primary antialiased selection:bg-accent/30 selection:text-accent">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <GlobalEffects />
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
      </body>
    </html>
  )
}
