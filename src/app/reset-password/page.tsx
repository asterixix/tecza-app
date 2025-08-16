"use client"

import { useEffect } from "react"

export default function ResetPasswordRedirect() {
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    const target = `/l${hash || ""}`
    // Preserve Supabase recovery hash and forward to /l
    window.location.replace(target)
  }, [])
  return null
}
