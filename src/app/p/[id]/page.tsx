"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { PostItem, type PostRecord } from "@/components/dashboard/post-item"

export default function PostPage() {
  const supabase = getSupabase()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const postId = params?.id

  const [post, setPost] = useState<PostRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !postId) return
      setLoading(true)
      try {
        const { data } = await supabase
          .from("posts")
          .select(
            "id,user_id,content,visibility,created_at,media_urls,hashtags,community_id",
          )
          .eq("id", postId)
          .maybeSingle()
        if (!cancelled) setPost((data as PostRecord) || null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [supabase, postId])

  if (loading)
    return <div className="mx-auto max-w-2xl p-4 md:p-6">Wczytywanie…</div>

  if (!post)
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        Nie znaleziono posta lub nie masz do niego dostępu.
      </div>
    )

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <PostItem
        post={post}
        onChange={(type) => {
          if (type === "deleted") {
            // After deletion, go back or to dashboard
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back()
            } else {
              router.push("/d")
            }
          }
        }}
      />
    </div>
  )
}
