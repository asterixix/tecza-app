"use client"

import { useEffect, useState } from "react"
import { SiteFooter } from "./site-footer"
import { UserFooter } from "./user-footer"
import { getSupabase } from "@/lib/supabase-browser"

export function FooterSwitch() {
  const supabase = getSupabase()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) return setAuthed(false)
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [supabase])

  if (authed === null) return <SiteFooter />
  return authed ? <UserFooter /> : <SiteFooter />
}
