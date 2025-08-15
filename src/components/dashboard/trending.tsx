"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Hash } from "lucide-react"
import { getSupabase } from "@/lib/supabase-browser"
import { cn } from "@/lib/utils"

interface TrendingHashtagsProps {
  onHashtagClick?: (hashtag: string) => void
  selectedHashtag?: string | null
}

export function TrendingHashtags({ onHashtagClick, selectedHashtag }: TrendingHashtagsProps) {
  const supabase = getSupabase()
  const [items, setItems] = useState<{ tag: string; uses: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!supabase) return
      setLoading(true)
      
      // Compute trending by scanning recent posts for hashtags array
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // last 24h
      const { data } = await supabase
        .from("posts")
        .select("hashtags")
        .gte("created_at", since)
        .limit(500)
      
      const counts = new Map<string, number>()
      ;(data || []).forEach((row: { hashtags: string[] | null }) => {
        ;(row.hashtags || []).forEach((h) => {
          const tag = h.startsWith("#") ? h.toLowerCase() : `#${h.toLowerCase()}`
          counts.set(tag, (counts.get(tag) || 0) + 1)
        })
      })
      
      const arr = Array.from(counts.entries())
        .map(([tag, uses]) => ({ tag, uses }))
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 10)
      
      setItems(arr)
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleHashtagClick = (hashtag: string) => {
    const cleanTag = hashtag.replace('#', '')
    onHashtagClick?.(cleanTag)
  }

  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4" />
          <h2 className="font-semibold">Trendy</h2>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-4">
                <Hash className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Brak trendów (jeszcze).</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dodaj hashtagi do swoich postów!
                </p>
              </div>
            ) : (
              items.map((item, index) => {
                const isSelected = selectedHashtag === item.tag.replace('#', '')
                return (
                  <div key={item.tag} className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHashtagClick(item.tag)}
                      className={cn(
                        "h-auto p-2 justify-start flex-1 hover:bg-muted/50",
                        isSelected && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-xs text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span className="font-medium truncate">{item.tag}</span>
                        </div>
                      </div>
                    </Button>
                    <Badge 
                      variant="secondary" 
                      className="ml-2 text-xs"
                      title={`${item.uses} użyć w ostatnich 24h`}
                    >
                      {item.uses}
                    </Badge>
                  </div>
                )
              })
            )}
          </div>
        )}
        
        {selectedHashtag && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground text-center">
              Przeglądasz: <span className="font-medium">#{selectedHashtag}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
