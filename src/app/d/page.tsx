"use client"

import { PostComposer } from "@/components/dashboard/post-composer"
import { Feed } from "@/components/dashboard/feed"
import { Badge } from "@/components/ui/badge"
import { TrendingHashtags } from "@/components/dashboard/trending"
import { SuggestedProfiles } from "@/components/dashboard/suggested"
import { Button } from "@/components/ui/button"
import { useState, useEffect, Suspense } from "react"
import { RotateCw, X } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null)

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
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <PostComposer open={open} onOpenChange={setOpen} />
          {selectedHashtag ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Posty z tagiem #{selectedHashtag}</h2>
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
          <TrendingHashtags onHashtagClick={handleHashtagClick} selectedHashtag={selectedHashtag} />
          <SuggestedProfiles />
        </aside>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Ładowanie pulpitu...</p>
            </div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
