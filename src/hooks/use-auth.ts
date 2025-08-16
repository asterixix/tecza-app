"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { KeyManager } from "@/lib/crypto/key-manager"

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

    const { data: sub } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      setState((s) => ({
        ...s,
        user: session?.user ? { id: session.user.id, email: session.user.email } : null,
      }))
      if (session?.user) {
        // Ensure public key exists in profile
        const { data: profile } = await supabase!
          .from("profiles")
          .select("id, public_key")
          .eq("id", session.user.id)
          .single()
        if (profile && !profile.public_key) {
          const { publicKey } = await KeyManager.getOrCreateKeyPair()
          await supabase!
            .from("profiles")
            .update({ public_key: publicKey })
            .eq("id", session.user.id)
        }
      }
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  return state
}
