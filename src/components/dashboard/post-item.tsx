"use client"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export type PostRecord = {
  id: string
  user_id: string
  content: string
  visibility: "public" | "friends" | "private" | "unlisted"
  created_at: string
}

function visibilityLabel(v: PostRecord["visibility"]) {
  switch (v) {
    case "public": return "Publiczny"
    case "friends": return "Tylko znajomi"
    case "private": return "Prywatny"
    case "unlisted": return "Nielistowany"
  }
}

export function PostItem({ post }: { post: PostRecord }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{new Date(post.created_at).toLocaleString()}</div>
          <Badge variant="outline">{visibilityLabel(post.visibility)}</Badge>
        </div>
        <Separator />
        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
          {post.content}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <Link href={`#/post/${post.id}`}>Szczegóły</Link>
        </div>
      </CardContent>
    </Card>
  )
}
