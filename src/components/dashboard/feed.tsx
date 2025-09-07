"use client"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { PostItem, type PostRecord } from "./post-item"
import { SkeletonPost } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  RefreshCw,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type MinimalProfile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

type ExtendedPostRecord = PostRecord & {
  likes_count?: number
  comments_count?: number
}

type PostLikeRow = { post_id: string }
type FollowRow = { following_id: string }
type LikedPost = { id: string; user_id: string; hashtags: string[] | null }

type FeedSortOption = "newest" | "trending"

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
  const [hasMore, setHasMore] = useState(true)
  const [sortOption, setSortOption] = useState<FeedSortOption>("newest")
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const cursorRef = useRef<{ created_at: string; id: string } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pullingRef = useRef(false)
  const startYRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cache community memberships during the component lifecycle
  const memberCommunitiesRef = useRef<string[] | null>(null)

  // Suggestions derived from liked posts
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [authorSuggestions, setAuthorSuggestions] = useState<MinimalProfile[]>(
    [],
  )
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})

  const ensureMemberships = useCallback(async () => {
    if (!supabase) return [] as string[]
    if (memberCommunitiesRef.current) return memberCommunitiesRef.current
    const {
      data: { user },
    } = await supabase.auth.getUser()
    let ids: string[] = []
    if (user) {
      const { data: memberships } = await supabase
        .from("community_memberships")
        .select("community_id")
        .eq("user_id", user.id)
      const list = (memberships as { community_id: string }[]) ?? []
      ids = list.map((m) => m.community_id)
    }
    memberCommunitiesRef.current = ids
    return ids
  }, [supabase])

  // Sort posts based on selected option
  const sortPosts = useCallback(
    (posts: PostRecord[]) => {
      switch (sortOption) {
        case "newest":
          return [...posts].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
        case "trending":
          // Sort by engagement (likes + comments + recency)
          return [...posts].sort((a, b) => {
            const aLikes = (a as ExtendedPostRecord).likes_count ?? 0
            const bLikes = (b as ExtendedPostRecord).likes_count ?? 0
            const aComments = (a as ExtendedPostRecord).comments_count ?? 0
            const bComments = (b as ExtendedPostRecord).comments_count ?? 0
            const aEngagement = aLikes + aComments
            const bEngagement = bLikes + bComments
            const aRecency = new Date(a.created_at).getTime()
            const bRecency = new Date(b.created_at).getTime()
            const aScore = aEngagement + aRecency / 1000000 // Weight recent posts
            const bScore = bEngagement + bRecency / 1000000
            return bScore - aScore
          })
        default:
          return posts
      }
    },
    [sortOption],
  )

  // Memoized sorted posts
  const processedPosts = useMemo(() => {
    return sortPosts(posts)
  }, [posts, sortPosts])

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const memberCommunityIds = await ensureMemberships()

      // Build posts query: include posts with community_id null OR in memberCommunityIds
      let query = supabase
        .from("posts")
        .select(
          "id,user_id,content,visibility,created_at,media_urls,hashtags,community_id,likes_count,comments_count",
        )
        .is("hidden_at", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(20)

      // Filter by hashtag if provided
      if (hashtag) {
        // Use array contains for hashtags, supported by GIN index if present
        query = query.contains("hashtags", [hashtag])
      }

      if (memberCommunityIds.length > 0) {
        // Use OR to include public (no community) or member communities
        query = query.or(
          `community_id.is.null,community_id.in.(${memberCommunityIds
            .map((id) => `${id}`)
            .join(",")})`,
        )
      } else {
        // Not a member of any community – only show non-community posts
        query = query.is("community_id", null)
      }

      const { data, error } = await query
      if (error) {
        console.error("Error loading posts:", error)
        setError("Nie udało się załadować postów")
        toast.error("Błąd podczas ładowania postów")
        return
      }

      if (data) {
        const rows = data as PostRecord[]
        setPosts(rows)
        setHasMore(rows.length >= 20)
        setLastRefresh(new Date())
        if (rows.length > 0) {
          cursorRef.current = {
            created_at: rows[rows.length - 1].created_at,
            id: rows[rows.length - 1].id,
          }
        } else {
          cursorRef.current = null
        }
      }
    } catch (err) {
      console.error("Unexpected error loading posts:", err)
      setError("Nieoczekiwany błąd podczas ładowania postów")
      toast.error("Wystąpił nieoczekiwany błąd")
    } finally {
      setLoading(false)
    }
  }, [supabase, hashtag, ensureMemberships])

  useEffect(() => {
    load()
  }, [load])
  // Trigger reload from parent when the signal changes
  useEffect(() => {
    if (reloadSignal !== undefined) void load()
  }, [reloadSignal, load])

  const loadMore = useCallback(async () => {
    if (!supabase || loadingMoreRef.current || !cursorRef.current) return
    loadingMoreRef.current = true
    try {
      const memberCommunityIds = await ensureMemberships()

      let query = supabase
        .from("posts")
        .select(
          "id,user_id,content,visibility,created_at,media_urls,hashtags,community_id",
        )
        .is("hidden_at", null)
        // Keyset pagination by created_at; id is secondary ordering key
        .lt("created_at", cursorRef.current.created_at)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(20)

      if (hashtag) query = query.contains("hashtags", [hashtag])

      if (memberCommunityIds.length > 0) {
        query = query.or(
          `community_id.is.null,community_id.in.(${memberCommunityIds
            .map((id) => `${id}`)
            .join(",")})`,
        )
      } else {
        query = query.is("community_id", null)
      }

      const { data, error } = await query
      if (!error && data) {
        const rows = data as PostRecord[]
        setPosts((prev) => [...prev, ...rows])
        setHasMore(rows.length >= 20)
        if (rows.length > 0) {
          cursorRef.current = {
            created_at: rows[rows.length - 1].created_at,
            id: rows[rows.length - 1].id,
          }
        }
      }
    } finally {
      loadingMoreRef.current = false
    }
  }, [supabase, hashtag, ensureMemberships])

  // IntersectionObserver to auto-load more content
  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasMore && !loading) {
          void loadMore()
        }
      },
      { root: null, rootMargin: "256px 0px 256px 0px", threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, loadMore])

  // Suggestions based on liked posts (top hashtags and authors not yet followed)
  const computeSuggestions = useCallback(async () => {
    if (!supabase || hashtag) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // 1) Fetch recent likes
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
    const likedIds = ((likes as PostLikeRow[]) || []).map((l) => l.post_id)
    if (likedIds.length === 0) return

    // 2) Fetch posts for those likes
    const { data: likedPosts } = await supabase
      .from("posts")
      .select("id,user_id,hashtags")
      .in("id", likedIds)
      .is("hidden_at", null)

    const tagCounts = new Map<string, number>()
    const authorCounts = new Map<string, number>()
    for (const p of (likedPosts as LikedPost[]) || []) {
      const tags: string[] = Array.isArray(p.hashtags) ? p.hashtags : []
      for (const t of tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
      if (p.user_id)
        authorCounts.set(p.user_id, (authorCounts.get(p.user_id) || 0) + 1)
    }

    // 3) Prepare hashtag suggestions (top 5)
    const tagsSorted = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .filter(Boolean)
      .slice(0, 5)
    setSuggestedTags(tagsSorted)

    // 4) Exclude already-followed authors
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
    const followingIds = new Set<string>(
      ((follows as FollowRow[]) || []).map((f) => f.following_id),
    )

    const authorSorted = Array.from(authorCounts.entries())
      .filter(([uid]) => !followingIds.has(uid))
      .sort((a, b) => b[1] - a[1])
      .map(([uid]) => uid)
      .slice(0, 5)

    if (authorSorted.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .in("id", authorSorted)
      setAuthorSuggestions((profiles as MinimalProfile[]) || [])
    }
    // Build follow map
    const map: Record<string, boolean> = {}
    for (const id of followingIds) map[id] = true
    setFollowingMap(map)
  }, [supabase, hashtag])

  useEffect(() => {
    void computeSuggestions()
  }, [computeSuggestions, reloadSignal])

  // Auto-refresh functionality
  useEffect(() => {
    if (!supabase) return

    // Set up auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(async () => {
      if (!loading && !loadingMoreRef.current) {
        try {
          const memberCommunityIds = await ensureMemberships()
          let query = supabase
            .from("posts")
            .select("id,created_at")
            .is("hidden_at", null)
            .order("created_at", { ascending: false })
            .limit(1)

          if (hashtag) {
            query = query.contains("hashtags", [hashtag])
          }

          if (memberCommunityIds.length > 0) {
            query = query.or(
              `community_id.is.null,community_id.in.(${memberCommunityIds
                .map((id) => `${id}`)
                .join(",")})`,
            )
          } else {
            query = query.is("community_id", null)
          }

          const { data } = await query
          if (data && data.length > 0) {
            const latestPost = data[0]
            const hasNewPosts =
              posts.length === 0 ||
              new Date(latestPost.created_at) > new Date(posts[0].created_at)

            if (hasNewPosts) {
              setNewPostsCount((prev) => prev + 1)
            }
          }
        } catch (error) {
          console.error("Error checking for new posts:", error)
        }
      }
    }, 30000) // Check every 30 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [supabase, posts, hashtag, loading, ensureMemberships])

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setNewPostsCount(0)
    await load()
    toast.success("Feed odświeżony")
  }, [load])

  if (!supabase) return null

  return (
    <div className="space-y-6">
      {/* Streamlined Feed Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant={sortOption === "newest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOption("newest")}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Najnowsze
            </Button>
            <Button
              variant={sortOption === "trending" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOption("trending")}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Popularne
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {newPostsCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {newPostsCount} nowych
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Odśwież
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-destructive/20 rounded-lg bg-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-sm text-destructive flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Spróbuj ponownie
          </Button>
        </div>
      )}

      {/* Last Refresh Info */}
      {lastRefresh && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4" />
          Ostatnio odświeżono: {lastRefresh.toLocaleTimeString()}
        </div>
      )}

      {/* Feed Content */}
      <div
        ref={containerRef}
        className="space-y-6"
        onScroll={(e) => {
          const el = e.currentTarget
          if (
            el.scrollTop + el.clientHeight >= el.scrollHeight - 64 &&
            hasMore &&
            !loading
          ) {
            void loadMore()
          }
        }}
        onTouchStart={(e) => {
          const el = containerRef.current
          if (!el) return
          const atTop = (document.scrollingElement?.scrollTop || 0) <= 0
          if (atTop) {
            pullingRef.current = true
            startYRef.current = e.touches[0].clientY
          }
        }}
        onTouchMove={(e) => {
          if (!pullingRef.current) return
          const dy = e.touches[0].clientY - startYRef.current
          // Trigger reload when pulling down more than 60px
          if (dy > 60 && !loading) {
            pullingRef.current = false
            void load()
          }
        }}
        onTouchEnd={() => {
          pullingRef.current = false
        }}
      >
        {!hashtag &&
          (suggestedTags.length > 0 || authorSuggestions.length > 0) && (
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-3 font-medium text-sm">
                Proponowane do obserwowania
              </div>
              {suggestedTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <a
                      key={tag}
                      href={`/d?hashtag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      #{tag}
                    </a>
                  ))}
                </div>
              )}
              {authorSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {authorSuggestions.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                    >
                      <a
                        href={`/u/${encodeURIComponent(p.username)}`}
                        className="hover:underline"
                      >
                        {p.display_name || p.username}
                      </a>
                      {!followingMap[p.id] && (
                        <button
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-primary hover:bg-primary/20 transition-colors"
                          onClick={async () => {
                            const {
                              data: { user },
                            } = await supabase.auth.getUser()
                            if (!user) return
                            const { error } = await supabase
                              .from("follows")
                              .insert({
                                follower_id: user.id,
                                following_id: p.id,
                              })
                            if (!error)
                              setFollowingMap((m) => ({ ...m, [p.id]: true }))
                          }}
                        >
                          Obserwuj
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        {loading && (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonPost key={i} />
            ))}
          </div>
        )}
        {processedPosts.map((p) => (
          <PostItem key={p.id} post={p} />
        ))}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
              onClick={() => void loadMore()}
            >
              Załaduj więcej
            </button>
          </div>
        )}
        {/* Sentinel used by IntersectionObserver */}
        <div ref={sentinelRef} aria-hidden="true" />
        {posts.length === 0 && !loading && (
          <div className="text-center py-8">
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
    </div>
  )
}
