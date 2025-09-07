"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Heart,
  MessageCircle,
  Hash,
  Calendar,
  BarChart3,
} from "lucide-react"

interface FeedAnalytics {
  totalPosts: number
  totalLikes: number
  totalComments: number
  topHashtags: Array<{ tag: string; count: number }>
  postsToday: number
  engagementRate: number
  mostActiveHour: number
}

export function FeedAnalytics() {
  const supabase = getSupabase()
  const [analytics, setAnalytics] = useState<FeedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      if (!supabase) return

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get user's posts
        const { data: posts } = await supabase
          .from("posts")
          .select("id,created_at,likes_count,comments_count,hashtags")
          .eq("user_id", user.id)
          .is("hidden_at", null)

        if (!posts) return

        // Calculate analytics
        const totalPosts = posts.length
        const totalLikes = posts.reduce(
          (sum, post) => sum + (post.likes_count || 0),
          0,
        )
        const totalComments = posts.reduce(
          (sum, post) => sum + (post.comments_count || 0),
          0,
        )

        // Posts today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const postsToday = posts.filter(
          (post) => new Date(post.created_at) >= today,
        ).length

        // Top hashtags
        const hashtagCounts: Record<string, number> = {}
        posts.forEach((post) => {
          if (post.hashtags && Array.isArray(post.hashtags)) {
            post.hashtags.forEach((tag) => {
              hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1
            })
          }
        })

        const topHashtags = Object.entries(hashtagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Most active hour
        const hourCounts: Record<number, number> = {}
        posts.forEach((post) => {
          const hour = new Date(post.created_at).getHours()
          hourCounts[hour] = (hourCounts[hour] || 0) + 1
        })

        const mostActiveHour =
          Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 0

        // Engagement rate (likes + comments per post)
        const engagementRate =
          totalPosts > 0
            ? ((totalLikes + totalComments) / totalPosts).toFixed(1)
            : 0

        setAnalytics({
          totalPosts,
          totalLikes,
          totalComments,
          topHashtags,
          postsToday,
          engagementRate:
            typeof engagementRate === "string"
              ? parseFloat(engagementRate)
              : engagementRate,
          mostActiveHour:
            typeof mostActiveHour === "string"
              ? parseInt(mostActiveHour)
              : mostActiveHour,
        })
      } catch (error) {
        console.error("Error loading analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [supabase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Twoje statystyki
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Twoje statystyki
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {analytics.totalPosts}
            </div>
            <div className="text-sm text-muted-foreground">Posty</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics.postsToday}
            </div>
            <div className="text-sm text-muted-foreground">Dzisiaj</div>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">
                {analytics.totalLikes}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Polubienia</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">
                {analytics.totalComments}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Komentarze</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">
                {analytics.engagementRate}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Średnia</div>
          </div>
        </div>

        {/* Top Hashtags */}
        {analytics.topHashtags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4" />
              <span className="text-sm font-medium">Popularne tagi</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {analytics.topHashtags.map(({ tag, count }) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Most Active Hour */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Najaktywniejsza godzina: {analytics.mostActiveHour}:00</span>
        </div>
      </CardContent>
    </Card>
  )
}
