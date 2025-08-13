"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"

export default function ProfileRedirect() {
  const supabase = getSupabase()
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      if (!supabase) return
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) { router.replace("/login"); return }
      const { data } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
      const uname = data?.username
      router.replace(uname ? `/u/${uname}` : "/")
    })()
  }, [supabase, router])

  return null
}
