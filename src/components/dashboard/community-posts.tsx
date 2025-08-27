"use client"
import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PostComposer } from "@/components/dashboard/post-composer"
import { PostItem, type PostRecord } from "@/components/dashboard/post-item"
import { RotateCw } from "lucide-react"

// Safe error message extractor to avoid `any`
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message
    if (typeof msg === "string") return msg
  }
  return ""
}

// Use "*" to ensure PostItem gets all required fields
const SELECT_COLS = "*" as const

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
  const [error, setError] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [localRefresh, setLocalRefresh] = useState(0)

  async function loadFirst() {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(SELECT_COLS)
        .eq("community_id", communityId)
        .is("hidden_at", null)
        .order("created_at", { ascending: false })
        .limit(pageSize)
      if (error) throw error
      const rows = (data || []) as unknown as PostRecord[]
      setPosts(rows)
      setHasMore(rows.length === pageSize)
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Wystąpił błąd podczas ładowania postów.")
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!supabase) return
    if (loadingMore || !hasMore || posts.length === 0) return
    setLoadingMore(true)
    setError(null)
    try {
      const last = posts[posts.length - 1]
      const { data, error } = await supabase
        .from("posts")
        .select(SELECT_COLS)
        .eq("community_id", communityId)
        .is("hidden_at", null)
        .lt("created_at", last.created_at)
        .order("created_at", { ascending: false })
        .limit(pageSize)
      if (error) throw error
      const rows = (data || []) as unknown as PostRecord[]
      setPosts((prev) => [...prev, ...rows])
      setHasMore(rows.length === pageSize)
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Nie udało się wczytać kolejnych postów.")
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    void loadFirst()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, pageSize, refreshToken, localRefresh])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Posty społeczności</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Odśwież"
            onClick={() => setLocalRefresh((x) => x + 1)}
          >
            <RotateCw className="size-4" />
          </Button>
          <Button size="sm" onClick={() => setComposerOpen(true)}>
            Nowy post
          </Button>
        </div>
      </div>

      <PostComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        communityId={communityId}
        onPosted={() => {
          setComposerOpen(false)
          setLocalRefresh((x) => x + 1)
        }}
      />
      {loading && posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Ładowanie postów…
          </CardContent>
        </Card>
      ) : null}

      {error && posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-3">{error}</p>
            <Button variant="outline" onClick={() => void loadFirst()}>
              Spróbuj ponownie
            </Button>
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

      {!loading && !error && posts.length === 0 && (
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
