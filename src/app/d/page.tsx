"use client"

import { PostComposer } from "@/components/dashboard/post-composer"
import { Feed } from "@/components/dashboard/feed"
import { Badge } from "@/components/ui/badge"
import { TrendingHashtags } from "@/components/dashboard/trending"
import { SuggestedProfiles } from "@/components/dashboard/suggested"
import { FeedAnalytics } from "@/components/dashboard/feed-analytics"
import { Button } from "@/components/ui/button"
import { useState, useEffect, Suspense } from "react"
import { RotateCw, X, Settings, Bell, Search } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonText,
  SkeletonPost,
} from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Handle hashtag from URL parameters
  useEffect(() => {
    const hashtag = searchParams.get("hashtag")
    if (hashtag) {
      setSelectedHashtag(hashtag.toLowerCase())
    } else {
      setSelectedHashtag(null)
    }
  }, [searchParams])

  const handleHashtagClick = (hashtag: string) => {
    const cleanTag = hashtag.replace("#", "").toLowerCase()
    setSelectedHashtag(cleanTag)
    router.push(`/dashboard?hashtag=${encodeURIComponent(cleanTag)}`)
  }

  const clearHashtagFilter = () => {
    setSelectedHashtag(null)
    router.push("/dashboard")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
      {/* Enhanced Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {selectedHashtag
                ? `Posty z tagiem #${selectedHashtag}`
                : "Twój osobisty feed"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj postów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Twój pulpit</Badge>
            {selectedHashtag && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-2">
                  #{selectedHashtag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={clearHashtagFilter}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Odśwież"
              onClick={() => setReloadTick((t) => t + 1)}
            >
              <RotateCw className="size-4" />
            </Button>
            <Button onClick={() => setOpen(true)}>Utwórz nowy post</Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <PostComposer
            open={open}
            onOpenChange={setOpen}
            onPosted={() => setReloadTick((t) => t + 1)}
          />
          {selectedHashtag ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Posty z tagiem #{selectedHashtag}
                </h2>
                <Button variant="ghost" size="sm" onClick={clearHashtagFilter}>
                  Pokaż wszystkie posty
                </Button>
              </div>
              <Feed reloadSignal={reloadTick} hashtag={selectedHashtag} />
            </div>
          ) : (
            <Feed reloadSignal={reloadTick} />
          )}
        </div>
        <aside className="lg:col-span-4 space-y-6">
          <div className="sticky top-6 space-y-6">
            <FeedAnalytics />
            <Separator />
            <TrendingHashtags
              onHashtagClick={handleHashtagClick}
              selectedHashtag={selectedHashtag}
            />
            <Separator />
            <SuggestedProfiles />
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post composer skeleton */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center space-x-3">
              <SkeletonAvatar size="md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <SkeletonText lines={3} />
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>

          {/* Posts skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonPost key={i} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggested profiles */}
          <div className="border rounded-lg p-4 space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <SkeletonAvatar size="sm" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Trending hashtags */}
          <div className="border rounded-lg p-4 space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
