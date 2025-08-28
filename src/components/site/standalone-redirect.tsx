"use client"

import { useEffect } from "react"
import { getSupabase } from "@/lib/supabase-browser"

// Redirect on first open in standalone/webapp mode:
// - to /d if logged in
// - to /l if not logged in
export function StandaloneRedirect() {
  const supabase = getSupabase()

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean }
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        nav.standalone === true)

    if (!isStandalone) return
    ;(async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      const hasSession = !!data.session
      const target = hasSession ? "/d" : "/l"
      // Avoid redirect loop
      if (window.location.pathname !== target) {
        window.location.replace(target)
      }
    })()
  }, [supabase])

  return null
}
