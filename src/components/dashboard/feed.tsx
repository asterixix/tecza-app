"use client"
import { useEffect, useState, useCallback } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { PostItem, type PostRecord } from "./post-item"
import { Button } from "@/components/ui/button"

export function Feed() {
  const supabase = getSupabase()
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from("posts")
      .select("id,user_id,content,visibility,created_at")
      .order("created_at", { ascending: false })
      .limit(20)
    if (!error && data) setPosts(data as PostRecord[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  if (!supabase) return null

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load} disabled={loading} aria-busy={loading}>
          {loading ? "Ładowanie…" : "Odśwież"}
        </Button>
      </div>
      {posts.map(p => (
        <PostItem key={p.id} post={p} />
      ))}
      {posts.length === 0 && !loading && <p className="text-sm text-muted-foreground">Brak postów do wyświetlenia.</p>}
    </div>
  )
}
