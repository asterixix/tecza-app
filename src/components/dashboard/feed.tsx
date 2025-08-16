"use client"
import { useEffect, useState, useCallback } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { PostItem, type PostRecord } from "./post-item"

export function Feed({ reloadSignal, hashtag }: { reloadSignal?: number; hashtag?: string }) {
  const supabase = getSupabase()
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)

    let query = supabase
      .from("posts")
      .select("id,user_id,content,visibility,created_at,media_urls,hashtags")
      .order("created_at", { ascending: false })
      .limit(20)

    // Filter by hashtag if provided
    if (hashtag) {
      query = query.contains("hashtags", [hashtag])
    }

    const { data, error } = await query
    if (!error && data) setPosts(data as PostRecord[])
    setLoading(false)
  }, [supabase, hashtag])

  useEffect(() => {
    load()
  }, [load])
  // Trigger reload from parent when the signal changes
  useEffect(() => {
    if (reloadSignal !== undefined) void load()
  }, [reloadSignal, load])

  if (!supabase) return null

  return (
    <div className="space-y-3">
      {loading && (
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Ładowanie postów...</div>
        </div>
      )}
      {posts.map((p) => (
        <PostItem key={p.id} post={p} />
      ))}
      {posts.length === 0 && !loading && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {hashtag ? `Brak postów z tagiem #${hashtag}` : "Brak postów do wyświetlenia."}
          </p>
          {hashtag && (
            <p className="text-xs text-muted-foreground mt-2">
              Spróbuj poszukać innego tagu lub sprawdź trendy.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
