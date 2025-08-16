"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"

export default function ProfilesManagement() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    (async () => {
      if (!supabase) { setAllowed(false); return }
      const u = (await supabase.auth.getUser()).data.user
      if (!u) { setAllowed(false); return }
      const { data: prof } = await supabase.from('profiles').select('roles').eq('id', u.id).maybeSingle()
      const roles = (prof?.roles as string[]|undefined) || []
      const ok = roles.includes('super-administrator')
      setAllowed(ok)
      if (!ok) window.location.href = "/d"
    })()
  }, [supabase])

  if (allowed === null || !allowed) return null

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Zarządzanie profilami (super-admin)</h1>
      <p className="text-sm text-muted-foreground mb-4">Dodawanie, modyfikowanie i usuwanie profili użytkowników. (UI w przygotowaniu)</p>
      {/* TODO: implement list + actions with confirmations */}
    </div>
  )
}
