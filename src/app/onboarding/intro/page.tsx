"use client"

import { useEffect } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function IntroOnboardingPage() {
  const supabase = getSupabase()

  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) { window.location.href = "/l"; return }
    })()
  }, [supabase])

  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-10 md:py-14">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">Witaj w Tęcza.app 🌈</h1>
          <p className="mt-1 text-muted-foreground">Twoje konto jest gotowe. Możesz przejść do pulpitu albo odwiedzić swój profil.</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => { window.location.href = "/d" }}>Przejdź do pulpitu</Button>
            <Button variant="outline" onClick={() => { window.location.href = "/u" }}>Odwiedź swój profil</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
