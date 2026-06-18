import type { Metadata } from "next"
import { Inter, Lora } from "next/font/google"
import { Suspense } from "react"

import { InternalAnalyticsTracker } from "@/components/analytics/InternalAnalyticsTracker"
import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { NavbarWrapper } from "@/components/layout/NavbarWrapper"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { DEFAULT_DESCRIPTION, getAppName, getAppUrl } from "@/lib/seo"

import "./globals.css"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
})

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-lora",
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
      className={`${inter.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <div className="flex min-h-screen flex-col">
            <NavbarWrapper>
              <Navbar />
            </NavbarWrapper>
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </ThemeProvider>
        <Suspense fallback={null}>
          <InternalAnalyticsTracker />
        </Suspense>
      </body>
    </html>
  )
}
