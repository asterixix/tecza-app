"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  Heart,
  TrendingUp,
  BarChart3,
  Activity,
  Clock,
  Award,
  MapPin,
  Wifi,
  DollarSign,
} from "lucide-react"

interface EventAnalytics {
  totalEvents: number
  totalParticipants: number
  totalInterested: number
  totalBookmarks: number
  averageParticipants: number
  engagementRate: number
  topCategories: Array<{
    category: string
    count: number
    percentage: number
  }>
  recentEvents: Array<{
    id: string
    title: string
    start_date: string
    participants_count: number
    category: string
  }>
  monthlyTrend: Array<{
    month: string
    events: number
    participants: number
  }>
  locationStats: {
    online: number
    offline: number
  }
  pricingStats: {
    free: number
    paid: number
  }
}

interface EventAnalyticsProps {
  organizerId?: string
  communityId?: string
}

export function EventAnalytics({
  organizerId,
  communityId,
}: EventAnalyticsProps) {
  const supabase = getSupabase()
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      if (!supabase) return

      try {
        // Build query based on filters
        let query = supabase.from("events").select(`
          id,title,start_date,end_date,category,is_online,is_free,
          event_participations(status),
          event_bookmarks(id)
        `)

        if (organizerId) {
          query = query.eq("organizer_id", organizerId)
        }
        if (communityId) {
          query = query.eq("community_id", communityId)
        }

        const { data: events, error } = await query

        if (error) {
          console.error("Error loading event analytics:", error)
          return
        }

        const eventsList = events || []

        // Calculate analytics
        const totalEvents = eventsList.length
        const totalParticipants = eventsList.reduce(
          (sum, event) =>
            sum +
            (event.event_participations?.filter((p) => p.status === "attending")
              .length || 0),
          0,
        )
        const totalInterested = eventsList.reduce(
          (sum, event) =>
            sum +
            (event.event_participations?.filter(
              (p) => p.status === "interested",
            ).length || 0),
          0,
        )
        const totalBookmarks = eventsList.reduce(
          (sum, event) => sum + (event.event_bookmarks?.length || 0),
          0,
        )

        const averageParticipants =
          totalEvents > 0 ? (totalParticipants / totalEvents).toFixed(1) : 0
        const engagementRate =
          totalEvents > 0
            ? ((totalParticipants + totalInterested) / totalEvents).toFixed(1)
            : 0

        // Top categories
        const categoryCounts = new Map<string, number>()
        eventsList.forEach((event) => {
          const count = categoryCounts.get(event.category) || 0
          categoryCounts.set(event.category, count + 1)
        })

        const topCategories = Array.from(categoryCounts.entries())
          .map(([category, count]) => ({
            category,
            count,
            percentage:
              totalEvents > 0 ? ((count / totalEvents) * 100).toFixed(1) : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Recent events (last 5)
        const recentEvents = eventsList
          .sort(
            (a, b) =>
              new Date(b.start_date).getTime() -
              new Date(a.start_date).getTime(),
          )
          .slice(0, 5)
          .map((event) => ({
            id: event.id,
            title: event.title,
            start_date: event.start_date,
            participants_count:
              event.event_participations?.filter(
                (p) => p.status === "attending",
              ).length || 0,
            category: event.category,
          }))

        // Monthly trend (last 6 months)
        const monthlyTrend = []
        for (let i = 5; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

          const monthEvents = eventsList.filter((event) => {
            const eventDate = new Date(event.start_date)
            return eventDate >= monthStart && eventDate <= monthEnd
          })

          const monthParticipants = monthEvents.reduce(
            (sum, event) =>
              sum +
              (event.event_participations?.filter(
                (p) => p.status === "attending",
              ).length || 0),
            0,
          )

          monthlyTrend.push({
            month: date.toLocaleDateString("pl-PL", {
              month: "short",
              year: "numeric",
            }),
            events: monthEvents.length,
            participants: monthParticipants,
          })
        }

        // Location stats
        const locationStats = {
          online: eventsList.filter((event) => event.is_online).length,
          offline: eventsList.filter((event) => !event.is_online).length,
        }

        // Pricing stats
        const pricingStats = {
          free: eventsList.filter((event) => event.is_free).length,
          paid: eventsList.filter((event) => !event.is_free).length,
        }

        setAnalytics({
          totalEvents,
          totalParticipants,
          totalInterested,
          totalBookmarks,
          averageParticipants:
            typeof averageParticipants === "string"
              ? parseFloat(averageParticipants)
              : averageParticipants,
          engagementRate:
            typeof engagementRate === "string"
              ? parseFloat(engagementRate)
              : engagementRate,
          topCategories: topCategories.map((cat) => ({
            ...cat,
            percentage:
              typeof cat.percentage === "string"
                ? parseFloat(cat.percentage)
                : cat.percentage,
          })),
          recentEvents,
          monthlyTrend,
          locationStats,
          pricingStats,
        })
      } catch (error) {
        console.error("Unexpected error loading event analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [supabase, organizerId, communityId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statystyki wydarzeń
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
            Statystyki wydarzeń
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analytics.totalEvents}
              </div>
              <div className="text-sm text-muted-foreground">Wydarzenia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalParticipants}
              </div>
              <div className="text-sm text-muted-foreground">Uczestnicy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.totalInterested}
              </div>
              <div className="text-sm text-muted-foreground">
                Zainteresowani
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.totalBookmarks}
              </div>
              <div className="text-sm text-muted-foreground">Zakładki</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">
                  {analytics.averageParticipants}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Średnia uczestników
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      {analytics.topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Najpopularniejsze kategorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topCategories.map((category, index) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        {category.category === "pride" && "Pride"}
                        {category.category === "support" && "Wsparcie"}
                        {category.category === "social" && "Społeczne"}
                        {category.category === "activism" && "Aktywizm"}
                        {category.category === "education" && "Edukacja"}
                        {category.category === "other" && "Inne"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.count} wydarzeń
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{category.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ostatnie wydarzenia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium line-clamp-1">{event.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(event.start_date).toLocaleDateString()} •{" "}
                    {event.participants_count} uczestników
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {event.category === "pride" && "Pride"}
                  {event.category === "support" && "Wsparcie"}
                  {event.category === "social" && "Społeczne"}
                  {event.category === "activism" && "Aktywizm"}
                  {event.category === "education" && "Edukacja"}
                  {event.category === "other" && "Inne"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location and Pricing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Typ wydarzeń
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-blue-500" />
                  <span>Online</span>
                </div>
                <Badge variant="secondary">
                  {analytics.locationStats.online}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>Offline</span>
                </div>
                <Badge variant="secondary">
                  {analytics.locationStats.offline}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cennik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-green-500" />
                  <span>Darmowe</span>
                </div>
                <Badge variant="secondary">{analytics.pricingStats.free}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                  <span>Płatne</span>
                </div>
                <Badge variant="secondary">{analytics.pricingStats.paid}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trend miesięczny
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.monthlyTrend.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="font-medium">{month.month}</div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {month.events} wydarzeń
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {month.participants} uczestników
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
