"use client"

import { PostComposer } from "@/components/dashboard/post-composer"
import { Feed } from "@/components/dashboard/feed"
import { Badge } from "@/components/ui/badge"
import { TrendingHashtags } from "@/components/dashboard/trending"
import { SuggestedProfiles } from "@/components/dashboard/suggested"
import { FeedAnalytics } from "@/components/dashboard/feed-analytics"
import { Button } from "@/components/ui/button"
import { useState, useEffect, Suspense } from "react"
import { RotateCw, X, Clock, TrendingUp } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonText,
  SkeletonPost,
} from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<"newest" | "trending">("newest")

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
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Streamlined Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-lg mt-1">
              {selectedHashtag
                ? `Posty z tagiem #${selectedHashtag}`
                : "Twój osobisty feed"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Odśwież"
              onClick={() => setReloadTick((t) => t + 1)}
            >
              <RotateCw className="size-4" />
            </Button>
            <Button onClick={() => setOpen(true)} size="lg">
              Utwórz nowy post
            </Button>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-1 mb-6">
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

        {/* Status Bar */}
        {selectedHashtag && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-2 text-sm">
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
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <PostComposer
            open={open}
            onOpenChange={setOpen}
            onPosted={() => setReloadTick((t) => t + 1)}
          />
          {selectedHashtag ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Posty z tagiem #{selectedHashtag}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Filtrowane posty dla tego hashtaga
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={clearHashtagFilter}>
                  Pokaż wszystkie posty
                </Button>
              </div>
              <Feed
                reloadSignal={reloadTick}
                hashtag={selectedHashtag}
                sortOption={sortOption}
              />
            </div>
          ) : (
            <Feed reloadSignal={reloadTick} sortOption={sortOption} />
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="sticky top-8 space-y-8">
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
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Post composer skeleton */}
          <div className="border rounded-lg p-6 space-y-4">
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

          {/* Feed header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Posts skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonPost key={i} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="space-y-8">
            {/* Analytics skeleton */}
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>

            {/* Trending hashtags skeleton */}
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-5 w-28" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested profiles skeleton */}
            <div className="border rounded-lg p-6 space-y-4">
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
          </div>
        </aside>
      </div>
    </div>
  )
}
