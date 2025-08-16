"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"

export default function AdminHome() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!supabase) {
        setAllowed(false)
        return
      }
      const { data } = await supabase.auth.getUser()
      const u = data.user
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
        ["moderator", "administrator", "super-administrator"].includes(r),
      )
      setAllowed(ok)
      if (!ok) {
        // Non-admins: redirect to dashboard
        window.location.href = "/d"
      }
    })()
  }, [supabase])

  if (allowed === null) return null
  if (!allowed) return null

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Panel administracyjny</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/moderation/content"
          className="rounded-md border p-4 hover:bg-muted"
        >
          Moderacja treści
          <div className="text-sm text-muted-foreground">
            Zgłoszenia, ukrywanie/usuwanie postów i komentarzy
          </div>
        </Link>
        <Link
          href="/admin/moderation/profiles"
          className="rounded-md border p-4 hover:bg-muted"
        >
          Moderacja profili
          <div className="text-sm text-muted-foreground">
            Zgłoszenia użytkowników, blokady
          </div>
        </Link>
        <Link
          href="/admin/moderation/communities"
          className="rounded-md border p-4 hover:bg-muted"
        >
          Społeczności i wydarzenia
          <div className="text-sm text-muted-foreground">
            Przegląd i interwencje
          </div>
        </Link>
        <Link
          href="/admin/roles"
          className="rounded-md border p-4 hover:bg-muted"
        >
          Role i uprawnienia
          <div className="text-sm text-muted-foreground">
            Zarządzaj rolami użytkowników
          </div>
        </Link>
        <Link
          href="/admin/profiles"
          className="rounded-md border p-4 hover:bg-muted"
        >
          Zarządzanie profilami (super-admin)
          <div className="text-sm text-muted-foreground">
            Dodaj, modyfikuj, usuwaj profile
          </div>
        </Link>
        <a
          href="https://supabase.com/dashboard/project/earfxvgvrqgyfzuwaqga"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border p-4 hover:bg-muted"
        >
          Supabase — dashboard
          <div className="text-sm text-muted-foreground">
            Przejdź do zarządzania bazą danych
          </div>
        </a>
        <a
          href="https://vercel.com/asterixixs-projects/tecza-app"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border p-4 hover:bg-muted"
        >
          Vercel — projekt
          <div className="text-sm text-muted-foreground">
            Zarządzanie wdrożeniem
          </div>
        </a>
      </div>
    </div>
  )
}
