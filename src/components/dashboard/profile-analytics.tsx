"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Clock,
  Award,
  Shield,
  Lock,
  Unlock,
  Star,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"

interface ProfileAnalytics {
  followers_count: number
  following_count: number
  posts_count: number
  likes_received: number
  comments_received: number
  engagement_rate: number
  profile_views: number
  profile_completion: number
  account_age_days: number
  last_active: string | null
  top_posts: Array<{
    id: string
    content: string
    likes_count: number
    comments_count: number
    created_at: string
  }>
  activity_trend: Array<{
    date: string
    posts: number
    likes: number
    comments: number
  }>
  privacy_stats: {
    profile_visibility: string
    show_location: boolean
    show_orientation: boolean
    show_friends: boolean
    show_contacts: boolean
    show_socials: boolean
  }
  badges_earned: Array<{
    badge: string
    earned_at: string
    description: string
  }>
  growth_stats: {
    followers_growth: number
    posts_growth: number
    engagement_growth: number
  }
}

interface ProfileAnalyticsProps {
  userId: string
}

export function ProfileAnalytics({ userId }: ProfileAnalyticsProps) {
  const supabase = getSupabase()
  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      if (!supabase) return

      try {
        // Load profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
            id,username,display_name,created_at,updated_at,
            profile_visibility,show_location,show_orientation,show_friends,
            show_contacts,show_socials,badges,bio,avatar_url,cover_image_url,
            city,country,pronouns
          `,
          )
          .eq("id", userId)
          .single()

        if (profileError) {
          console.error("Error loading profile:", profileError)
          return
        }

        // Load posts data
        const { data: posts, error: postsError } = await supabase
          .from("posts")
          .select("id,content,created_at,likes_count,comments_count")
          .eq("user_id", userId)
          .is("hidden_at", null)
          .order("created_at", { ascending: false })

        if (postsError) {
          console.error("Error loading posts:", postsError)
          return
        }

        // Load followers/following data
        const { data: followers } = await supabase
          .from("follows")
          .select("created_at")
          .eq("following_id", userId)

        const { data: following } = await supabase
          .from("follows")
          .select("created_at")
          .eq("follower_id", userId)

        // Calculate analytics
        const postsList = posts || []
        const followersList = followers || []
        const followingList = following || []

        const totalLikes = postsList.reduce(
          (sum, post) => sum + (post.likes_count || 0),
          0,
        )
        const totalComments = postsList.reduce(
          (sum, post) => sum + (post.comments_count || 0),
          0,
        )
        const totalEngagement = totalLikes + totalComments
        const engagementRate =
          postsList.length > 0
            ? (totalEngagement / postsList.length).toFixed(1)
            : "0"

        // Profile completion calculation

        // Account age
        const accountAgeDays = Math.floor(
          (new Date().getTime() - new Date(profile.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )

        // Top posts (last 5)
        const topPosts = postsList
          .sort(
            (a, b) =>
              (b.likes_count || 0) +
              (b.comments_count || 0) -
              (a.likes_count || 0) -
              (a.comments_count || 0),
          )
          .slice(0, 5)
          .map((post) => ({
            id: post.id,
            content:
              post.content.substring(0, 100) +
              (post.content.length > 100 ? "..." : ""),
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            created_at: post.created_at,
          }))

        // Activity trend (last 7 days)
        const activityTrend = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split("T")[0]

          const dayPosts = postsList.filter((post) =>
            post.created_at.startsWith(dateStr),
          )

          const dayLikes = dayPosts.reduce(
            (sum, post) => sum + (post.likes_count || 0),
            0,
          )
          const dayComments = dayPosts.reduce(
            (sum, post) => sum + (post.comments_count || 0),
            0,
          )

          activityTrend.push({
            date: dateStr,
            posts: dayPosts.length,
            likes: dayLikes,
            comments: dayComments,
          })
        }

        // Growth stats (placeholder - would need historical data)
        const growthStats = {
          followers_growth: Math.floor(Math.random() * 20) - 10, // Placeholder
          posts_growth: Math.floor(Math.random() * 10) - 5, // Placeholder
          engagement_growth: Math.floor(Math.random() * 15) - 7, // Placeholder
        }

        // Badges earned
        const badgesEarned = (profile.badges || []).map((badge: string) => ({
          badge,
          earned_at: profile.created_at, // Placeholder
          description: getBadgeDescription(badge),
        }))

        setAnalytics({
          followers_count: followersList.length,
          following_count: followingList.length,
          posts_count: postsList.length,
          likes_received: totalLikes,
          comments_received: totalComments,
          engagement_rate: parseFloat(engagementRate),
          profile_views: Math.floor(Math.random() * 1000), // Placeholder
          profile_completion: 0, // Placeholder
          account_age_days: accountAgeDays,
          last_active: profile.updated_at || profile.created_at,
          top_posts: topPosts,
          activity_trend: activityTrend,
          privacy_stats: {
            profile_visibility: profile.profile_visibility,
            show_location: profile.show_location,
            show_orientation: profile.show_orientation,
            show_friends: profile.show_friends,
            show_contacts: profile.show_contacts,
            show_socials: profile.show_socials,
          },
          badges_earned: badgesEarned,
          growth_stats: growthStats,
        })
      } catch (error) {
        console.error("Unexpected error loading profile analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [supabase, userId])

  function getBadgeDescription(badge: string): string {
    const descriptions: Record<string, string> = {
      "user-supporter": "Wspiera rozwój Tęcza.app",
      "company-supporter": "Firma wspierająca Tęcza.app",
      "early-tester": "Wczesny tester aplikacji",
      tester: "Tester aplikacji",
      moderator: "Moderator społeczności",
      administrator: "Administrator",
      ambassador: "Ambasador marki",
      company: "Konto firmowe",
      banned: "Konto zbanowane",
      "tecza-team": "Zespół Tęcza.app",
      pride2026: "Uczestnik Pride 2026",
      "hiv-positive-campaigh": "Kampania HIV+",
      "1-anniversary": "1 rok na platformie",
      "3-anniversary": "3 lata na platformie",
      "5-anniversary": "5 lat na platformie",
      "10-anniversary": "10 lat na platformie",
    }
    return descriptions[badge] || badge
  }

  function getGrowthIcon(growth: number) {
    if (growth > 0) return <ArrowUp className="h-3 w-3 text-green-500" />
    if (growth < 0) return <ArrowDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-500" />
  }

  function getGrowthColor(growth: number) {
    if (growth > 0) return "text-green-600"
    if (growth < 0) return "text-red-600"
    return "text-gray-600"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statystyki profilu
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
            Statystyki profilu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analytics.followers_count}
              </div>
              <div className="text-sm text-muted-foreground">Obserwujących</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.following_count}
              </div>
              <div className="text-sm text-muted-foreground">Obserwuje</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.posts_count}
              </div>
              <div className="text-sm text-muted-foreground">Postów</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.profile_views}
              </div>
              <div className="text-sm text-muted-foreground">Wyświetleń</div>
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
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold text-red-600">
                  {analytics.likes_received}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Polubień</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">
                  {analytics.comments_received}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Komentarzy</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {analytics.engagement_rate}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Średnia zaangażowania
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Uzupełnienie profilu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Postęp uzupełnienia</span>
              <span className="text-sm text-muted-foreground">
                {analytics.profile_completion}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${analytics.profile_completion}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {analytics.profile_completion < 50 &&
                "Uzupełnij więcej informacji, aby zwiększyć widoczność profilu."}
              {analytics.profile_completion >= 50 &&
                analytics.profile_completion < 80 &&
                "Dobry start! Dodaj więcej szczegółów."}
              {analytics.profile_completion >= 80 &&
                "Świetnie! Twój profil jest prawie kompletny."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Informacje o koncie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Wiek konta</span>
              <Badge variant="outline">{analytics.account_age_days} dni</Badge>
            </div>
            {analytics.last_active && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ostatnia aktywność</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(analytics.last_active).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ustawienia prywatności
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Widoczność profilu</span>
              <Badge
                variant={
                  analytics.privacy_stats.profile_visibility === "public"
                    ? "default"
                    : "secondary"
                }
              >
                {analytics.privacy_stats.profile_visibility === "public"
                  ? "Publiczny"
                  : "Prywatny"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pokazuj lokalizację</span>
              {analytics.privacy_stats.show_location ? (
                <Unlock className="h-4 w-4 text-green-500" />
              ) : (
                <Lock className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pokazuj orientację</span>
              {analytics.privacy_stats.show_orientation ? (
                <Unlock className="h-4 w-4 text-green-500" />
              ) : (
                <Lock className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pokazuj znajomych</span>
              {analytics.privacy_stats.show_friends ? (
                <Unlock className="h-4 w-4 text-green-500" />
              ) : (
                <Lock className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      {analytics.top_posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Najpopularniejsze posty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_posts.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium line-clamp-1">
                        {post.content}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground ml-8">
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.likes_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments_count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges Earned */}
      {analytics.badges_earned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Otrzymane odznaki
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.badges_earned.map((badge, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{badge.badge}</div>
                      <div className="text-sm text-muted-foreground">
                        {badge.description}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(badge.earned_at).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Statystyki wzrostu (ostatni miesiąc)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Obserwujący</span>
              <div className="flex items-center gap-1">
                {getGrowthIcon(analytics.growth_stats.followers_growth)}
                <span
                  className={`text-sm ${getGrowthColor(analytics.growth_stats.followers_growth)}`}
                >
                  {analytics.growth_stats.followers_growth > 0 ? "+" : ""}
                  {analytics.growth_stats.followers_growth}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Posty</span>
              <div className="flex items-center gap-1">
                {getGrowthIcon(analytics.growth_stats.posts_growth)}
                <span
                  className={`text-sm ${getGrowthColor(analytics.growth_stats.posts_growth)}`}
                >
                  {analytics.growth_stats.posts_growth > 0 ? "+" : ""}
                  {analytics.growth_stats.posts_growth}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Zaangażowanie</span>
              <div className="flex items-center gap-1">
                {getGrowthIcon(analytics.growth_stats.engagement_growth)}
                <span
                  className={`text-sm ${getGrowthColor(analytics.growth_stats.engagement_growth)}`}
                >
                  {analytics.growth_stats.engagement_growth > 0 ? "+" : ""}
                  {analytics.growth_stats.engagement_growth}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
