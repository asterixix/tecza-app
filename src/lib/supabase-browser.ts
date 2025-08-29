"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  if (!browserClient) {
    browserClient = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "tecza-app-auth",
      },
      db: { schema: "public" },
      global: {
        headers: {
          // Hint PostgREST to skip total count work unless asked explicitly
          Prefer: "count=none",
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 5, // rate-limit to avoid spamming server
        },
      },
    })
  }
  return browserClient
}
