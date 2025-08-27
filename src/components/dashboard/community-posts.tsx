"use client"
import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PostItem, type PostRecord } from "@/components/dashboard/post-item"

export function CommunityPosts({
  communityId,
  pageSize = 10,
  refreshToken,
}: {
  communityId: string
  pageSize?: number
  refreshToken?: number | string
}) {
  const supabase = getSupabase()
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const selectCols = useMemo(
    () =>
      "id,user_id,content,visibility,created_at,media_urls,hashtags" as const,
    [],
  )

  async function loadFirst() {
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(selectCols)
        .eq("community_id", communityId)
        .is("hidden_at", null)
        .order("created_at", { ascending: false })
        .limit(pageSize)
      if (error) throw error
      const rows = (data || []) as unknown as PostRecord[]
      setPosts(rows)
      setHasMore(rows.length === pageSize)
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!supabase) return
    if (loadingMore || !hasMore || posts.length === 0) return
    setLoadingMore(true)
    try {
      const last = posts[posts.length - 1]
      const { data, error } = await supabase
        .from("posts")
        .select(selectCols)
        .eq("community_id", communityId)
        .is("hidden_at", null)
        .lt("created_at", last.created_at)
        .order("created_at", { ascending: false })
        .limit(pageSize)
      if (error) throw error
      const rows = (data || []) as unknown as PostRecord[]
      setPosts((prev) => [...prev, ...rows])
      setHasMore(rows.length === pageSize)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    void loadFirst()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, selectCols, pageSize, refreshToken])

  return (
    <div className="space-y-4">
      {loading && posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Ładowanie postów…
          </CardContent>
        </Card>
      ) : null}

      {posts.map((p) => (
        <PostItem
          key={p.id}
          post={p}
          onChange={(type) => {
            if (type === "deleted")
              setPosts((prev) => prev.filter((x) => x.id !== p.id))
          }}
        />
      ))}

      {!loading && posts.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Brak postów w tej społeczności.
          </CardContent>
        </Card>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Wczytywanie…" : "Wczytaj więcej"}
          </Button>
        </div>
      )}
    </div>
  )
}
