"use client"

import { useEffect } from "react"

export function DevSWReset() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.getRegistrations().then((regs) => {
      if (!regs.length) return
      regs.forEach((r) => r.unregister().catch(() => {}))
      // Give the unregister a brief moment, then reload to fetch fresh HTML/CSS
      setTimeout(() => {
        // Disable cache for this reload attempt
        try {
          if ("caches" in window) {
            caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
          }
        } catch {}
        window.location.reload()
      }, 150)
    })
  }, [])

  return null
}
