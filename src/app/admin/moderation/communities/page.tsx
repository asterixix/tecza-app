"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"

export default function CommunitiesModeration() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!supabase) {
        setAllowed(false)
        return
      }
      const u = (await supabase.auth.getUser()).data.user
      if (!u) {
        setAllowed(false)
        return
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", u.id)
        .maybeSingle()
      const roles = (prof?.roles as string[] | undefined) || []
      const ok = roles.some((r) =>
        ["moderator", "administrator", "super-administrator"].includes(r)
      )
      setAllowed(ok)
      if (!ok) window.location.href = "/d"
    })()
  }, [supabase])

  if (allowed === null || !allowed) return null

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Moderacja społeczności i wydarzeń</h1>
      <p className="text-sm text-muted-foreground">
        Widok w przygotowaniu. Tu pojawią się zgłoszenia społeczności i wydarzeń.
      </p>
    </div>
  )
}
