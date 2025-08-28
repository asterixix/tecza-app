declare module "next-pwa" {
  import type { NextConfig } from "next"
  type PwaOptions = {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    // forwarded to Workbox GenerateSW by next-pwa
    importScripts?: string[]
    // next-pwa fallbacks support (e.g., offline document page)
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
    // Workbox runtime caching config - keep it broad to avoid version lock
    runtimeCaching?: Array<Record<string, unknown>>
  }
  export default function withPWA(
    options?: PwaOptions,
  ): (config: NextConfig) => NextConfig
}
