import type { NextConfig } from "next"
import withPWA from "next-pwa"

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "your-supabase-project.supabase.co"

const withPWAFn = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {
  images: {
    domains: [supabaseHost, "images.unsplash.com"],
  },
  async redirects() {
    return [
      { source: "/communities", destination: "/c", permanent: true },
      {
        source: "/communities/:path*",
        destination: "/c/:path*",
        permanent: true,
      },
      { source: "/dashboard", destination: "/d", permanent: true },
      { source: "/events", destination: "/w", permanent: true },
      { source: "/events/:path*", destination: "/w/:path*", permanent: true },
      { source: "/login", destination: "/l", permanent: true },
      { source: "/register", destination: "/r", permanent: true },
      { source: "/settings", destination: "/s", permanent: true },
      // Profile is now /u/:username; /profile can redirect to /u or homepage
      { source: "/profile", destination: "/u", permanent: false },
      // Keep /reset-password as a real page to preserve #type=recovery hash and forward client-side
      // Messaging removed; redirect old paths to home
      { source: "/messages", destination: "/", permanent: true },
      { source: "/messages/:path*", destination: "/", permanent: true },
    ]
  },
}

export default withPWAFn(nextConfig)
