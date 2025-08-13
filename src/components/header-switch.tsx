"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "./site-header"
import { UserHeader } from "./user-header"
import { getSupabase } from "@/lib/supabase-browser"

export function HeaderSwitch() {
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

  if (authed === null) return <SiteHeader />
  return authed ? <UserHeader /> : <SiteHeader />
}
