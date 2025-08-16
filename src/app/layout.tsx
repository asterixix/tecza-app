/* App layout */

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/site/theme-provider"
import { HeaderSwitch } from "@/components/site/header-switch"
import { FooterSwitch } from "@/components/site/footer-switch"
import { CookieBanner } from "@/components/site/cookie-banner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Tęcza.app — bezpieczna społeczność LGBTQ w Polsce",
  description:
    "Tęcza.app to nowoczesna, bezpieczna platforma społecznościowa dla polskiej społeczności LGBTQ: profil, znajomi, posty, wydarzenia i społeczności.",
  metadataBase: new URL("https://tecza.app"),
  applicationName: "Tęcza.app",
  keywords: [
    "LGBTQ",
    "społeczność",
    "Polska",
    "PWA",
    "wydarzenia",
    "społeczności",
  ],
  openGraph: {
    title: "Tęcza.app — bezpieczna społeczność LGBTQ w Polsce",
    description:
      "Połącz się, dziel się treścią i buduj wspólnotę w bezpiecznej przestrzeni.",
    url: "/",
    siteName: "Tęcza.app",
    locale: "pl_PL",
    type: "website",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:z-[999] focus:top-2 focus:left-2 focus:bg-background focus:text-foreground focus:border focus:border-ring focus:rounded-md focus:px-3 focus:py-2"
        >
          Pomiń do treści
        </a>
        <ThemeProvider>
          <HeaderSwitch />
          <main
            role="main"
            id="main-content"
            className="min-h-[calc(100dvh-56px-64px)]"
          >
            {children}
          </main>
          <FooterSwitch />
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
