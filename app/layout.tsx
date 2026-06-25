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
import { getAppearanceInitScript } from "@/lib/appearanceSession"

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
                ${getAppearanceInitScript()}
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
