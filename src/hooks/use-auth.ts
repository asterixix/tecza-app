"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
// E2EE key management removed; no crypto imports

interface AuthState {
  user: { id: string; email?: string | null } | null
  loading: boolean
}

export function useAuth(): AuthState {
  const supabase = getSupabase()
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const { data } = await supabase!.auth.getUser()
      if (!isMounted) return
      setState({
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        loading: false,
      })
    })()

    const { data: sub } = supabase!.auth.onAuthStateChange(
      async (_event, session) => {
        setState((s) => ({
          ...s,
          user: session?.user
            ? { id: session.user.id, email: session.user.email }
            : null,
        }))
        // E2EE public key bootstrap removed
      },
    )

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  return state
}
