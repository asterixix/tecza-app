"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  MessageCircle,
  Calendar,
  TrendingUp,
  Heart,
  BarChart3,
  Activity,
  Clock,
  Award,
  Zap,
} from "lucide-react"

interface CommunityAnalytics {
  totalMembers: number
  totalPosts: number
  totalComments: number
  totalEvents: number
  engagementRate: number
  growthRate: number
  activeMembers: number
  topContributors: Array<{
    id: string
    username: string
    display_name: string
    avatar_url?: string
    posts_count: number
    comments_count: number
  }>
  recentActivity: Array<{
    type: "post" | "comment" | "join" | "event"
    user: string
    content?: string
    created_at: string
  }>
  memberGrowth: Array<{
    date: string
    count: number
  }>
}

interface CommunityAnalyticsProps {
  communityId: string
}

export function CommunityAnalytics({ communityId }: CommunityAnalyticsProps) {
  const supabase = getSupabase()
  const [analytics, setAnalytics] = useState<CommunityAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      if (!supabase) return

      try {
        // Get community members count
        const { data: members } = await supabase
          .from("community_memberships")
          .select("user_id,created_at")
          .eq("community_id", communityId)

        // Get community posts
        const { data: posts } = await supabase
          .from("posts")
          .select("id,user_id,created_at")
          .eq("community_id", communityId)
          .is("hidden_at", null)

        // Get comments on community posts
        const postIds = posts?.map((p) => p.id) || []
        const { data: comments } =
          postIds.length > 0
            ? await supabase
                .from("post_comments")
                .select("id,user_id,created_at")
                .in("post_id", postIds)
            : { data: [] }

        // Get community events
        const { data: events } = await supabase
          .from("events")
          .select("id,created_at")
          .eq("community_id", communityId)

        // Calculate analytics
        const totalMembers = members?.length || 0
        const totalPosts = posts?.length || 0
        const totalComments = comments?.length || 0
        const totalEvents = events?.length || 0

        // Engagement rate (posts + comments per member)
        const engagementRate =
          totalMembers > 0
            ? ((totalPosts + totalComments) / totalMembers).toFixed(1)
            : 0

        // Growth rate (new members in last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const recentMembers =
          members?.filter((m) => new Date(m.created_at) >= thirtyDaysAgo)
            .length || 0
        const growthRate =
          totalMembers > 0
            ? ((recentMembers / totalMembers) * 100).toFixed(1)
            : 0

        // Active members (members who posted/commented in last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const activeUserIds = new Set([
          ...(posts
            ?.filter((p) => new Date(p.created_at) >= sevenDaysAgo)
            .map((p) => p.user_id) || []),
          ...(comments
            ?.filter((c) => new Date(c.created_at) >= sevenDaysAgo)
            .map((c) => c.user_id) || []),
        ])
        const activeMembers = activeUserIds.size

        // Top contributors
        const contributorMap = new Map<
          string,
          { posts: number; comments: number }
        >()
        posts?.forEach((post) => {
          const current = contributorMap.get(post.user_id) || {
            posts: 0,
            comments: 0,
          }
          contributorMap.set(post.user_id, {
            ...current,
            posts: current.posts + 1,
          })
        })
        comments?.forEach((comment) => {
          const current = contributorMap.get(comment.user_id) || {
            posts: 0,
            comments: 0,
          }
          contributorMap.set(comment.user_id, {
            ...current,
            comments: current.comments + 1,
          })
        })

        const topContributors = Array.from(contributorMap.entries())
          .map(([userId, counts]) => ({
            id: userId,
            username: `user_${userId.slice(0, 8)}`, // Placeholder
            display_name: `User ${userId.slice(0, 8)}`, // Placeholder
            posts_count: counts.posts,
            comments_count: counts.comments,
          }))
          .sort(
            (a, b) =>
              b.posts_count +
              b.comments_count -
              (a.posts_count + a.comments_count),
          )
          .slice(0, 5)

        // Recent activity
        const recentActivity = [
          ...(posts?.slice(0, 3).map((post) => ({
            type: "post" as const,
            user: `User ${post.user_id.slice(0, 8)}`,
            content: "Dodał nowy post",
            created_at: post.created_at,
          })) || []),
          ...(comments?.slice(0, 2).map((comment) => ({
            type: "comment" as const,
            user: `User ${comment.user_id.slice(0, 8)}`,
            content: "Skomentował post",
            created_at: comment.created_at,
          })) || []),
          ...(members?.slice(0, 2).map((member) => ({
            type: "join" as const,
            user: `User ${member.user_id.slice(0, 8)}`,
            content: "Dołączył do społeczności",
            created_at: member.created_at,
          })) || []),
        ]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 5)

        // Member growth (last 30 days)
        const memberGrowth = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          const dayStart = new Date(date.setHours(0, 0, 0, 0))
          const dayEnd = new Date(date.setHours(23, 59, 59, 999))

          const dayMembers =
            members?.filter((m) => {
              const memberDate = new Date(m.created_at)
              return memberDate >= dayStart && memberDate <= dayEnd
            }).length || 0

          memberGrowth.push({
            date: dayStart.toISOString().split("T")[0],
            count: dayMembers,
          })
        }

        setAnalytics({
          totalMembers,
          totalPosts,
          totalComments,
          totalEvents,
          engagementRate: parseFloat(
            typeof engagementRate === "string"
              ? engagementRate
              : String(engagementRate),
          ),
          growthRate: parseFloat(
            typeof growthRate === "string" ? growthRate : String(growthRate),
          ),
          activeMembers,
          topContributors,
          recentActivity,
          memberGrowth,
        })
      } catch (error) {
        console.error("Error loading community analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [supabase, communityId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statystyki społeczności
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
    <div className="space-y-6">
      {/* Main Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statystyki społeczności
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analytics.totalMembers}
              </div>
              <div className="text-sm text-muted-foreground">Członkowie</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalPosts}
              </div>
              <div className="text-sm text-muted-foreground">Posty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.totalComments}
              </div>
              <div className="text-sm text-muted-foreground">Komentarze</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.totalEvents}
              </div>
              <div className="text-sm text-muted-foreground">Wydarzenia</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {analytics.engagementRate}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Średnia zaangażowania
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">
                  {analytics.activeMembers}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Aktywni członkowie
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">
                  {analytics.growthRate}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Wzrost (30 dni)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      {analytics.topContributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Najaktywniejsi członkowie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topContributors.map((contributor, index) => (
                <div
                  key={contributor.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        {contributor.display_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{contributor.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {contributor.posts_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {contributor.comments_count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ostatnia aktywność
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  {activity.type === "post" && (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  {activity.type === "comment" && <Heart className="h-4 w-4" />}
                  {activity.type === "join" && <Users className="h-4 w-4" />}
                  {activity.type === "event" && (
                    <Calendar className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    {activity.content}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
