"use client"
import { useEffect, useState, useCallback } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { PostItem, type PostRecord } from "./post-item"

export function Feed({
  reloadSignal,
  hashtag,
}: {
  reloadSignal?: number
  hashtag?: string
}) {
  const supabase = getSupabase()
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      // Determine communities current user belongs to
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let memberCommunityIds: string[] = []
      if (user) {
        const { data: memberships } = await supabase
          .from("community_memberships")
          .select("community_id")
          .eq("user_id", user.id)
        memberCommunityIds = (
          (memberships as { community_id: string }[]) || []
        ).map((m) => m.community_id)
      }

      // Build posts query: include posts with community_id null OR in memberCommunityIds
      let query = supabase
        .from("posts")
        .select(
          "id,user_id,content,visibility,created_at,media_urls,hashtags,community_id",
        )
        .is("hidden_at", null)
        .order("created_at", { ascending: false })
        .limit(20)

      // Filter by hashtag if provided
      if (hashtag) {
        query = query.contains("hashtags", [hashtag])
      }

      if (memberCommunityIds.length > 0) {
        // Use OR to include public (no community) or member communities
        query = query.or(
          `community_id.is.null,community_id.in.(${memberCommunityIds
            .map((id) => `${id}`)
            .join(";")})`,
        )
      } else {
        // Not a member of any community – only show non-community posts
        query = query.is("community_id", null)
      }

      const { data, error } = await query
      if (!error && data) setPosts(data as PostRecord[])
    } finally {
      setLoading(false)
    }
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
          <div className="text-sm text-muted-foreground">
            Ładowanie postów...
          </div>
        </div>
      )}
      {posts.map((p) => (
        <PostItem key={p.id} post={p} />
      ))}
      {posts.length === 0 && !loading && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {hashtag
              ? `Brak postów z tagiem #${hashtag}`
              : "Brak postów do wyświetlenia."}
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
