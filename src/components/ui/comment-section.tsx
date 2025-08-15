"use client"

import { useState } from "react"
import { MessageCircle, Reply, Heart, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
    pronouns?: string
  }
  likes_count: number
  replies_count: number
  is_liked: boolean
  parent_id?: string
  replies?: Comment[]
}

interface CommentSectionProps {
  comments: Comment[]
  isLoading?: boolean
  onAddComment: (content: string, parentId?: string) => Promise<void>
  onLikeComment: (commentId: string) => Promise<void>
  onUnlikeComment: (commentId: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  currentUserId?: string
  className?: string
}

function CommentItem({ 
  comment, 
  onReply, 
  onLike, 
  onUnlike,
  onDelete,
  currentUserId,
  isReply = false 
}: {
  comment: Comment
  onReply: (parentId: string, content: string) => Promise<void>
  onLike: (commentId: string) => Promise<void>
  onUnlike: (commentId: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  currentUserId?: string
  isReply?: boolean
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return
    
    setIsSubmittingReply(true)
    try {
      await onReply(comment.id, replyContent)
      setReplyContent("")
      setShowReplyForm(false)
      setShowReplies(true)
    } catch (error) {
      console.error("Error submitting reply:", error)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleLikeToggle = async () => {
    try {
      if (comment.is_liked) {
        await onUnlike(comment.id)
      } else {
        await onLike(comment.id)
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const commentDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "teraz"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}g`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  return (
    <div className={cn("flex gap-3", isReply && "ml-8 mt-2")}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.user.avatar_url} />
        <AvatarFallback>
          {comment.user.display_name?.[0] || comment.user.username[0]}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {comment.user.display_name || comment.user.username}
            </span>
            {comment.user.pronouns && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {comment.user.pronouns}
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed break-words">
            {comment.content}
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>{timeAgo(comment.created_at)}</span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLikeToggle}
            className={cn(
              "h-auto p-0 text-xs font-medium hover:text-foreground",
              comment.is_liked && "text-red-500"
            )}
          >
            <Heart className={cn("h-3 w-3 mr-1", comment.is_liked && "fill-current")} />
            {comment.likes_count > 0 && comment.likes_count}
          </Button>
          
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="h-auto p-0 text-xs font-medium hover:text-foreground"
            >
              <Reply className="h-3 w-3 mr-1" />
              Odpowiedz
            </Button>
          )}
          
          {comment.replies_count > 0 && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="h-auto p-0 text-xs font-medium hover:text-foreground"
            >
              {showReplies ? "Ukryj" : "Pokaż"} odpowiedzi ({comment.replies_count})
            </Button>
          )}
          
          {(currentUserId === comment.user.id || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUserId === comment.user.id && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    Usuń komentarz
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {showReplyForm && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Napisz odpowiedź..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || isSubmittingReply}
              >
                {isSubmittingReply ? "Wysyłanie..." : "Odpowiedz"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReplyForm(false)
                  setReplyContent("")
                }}
              >
                Anuluj
              </Button>
            </div>
          </div>
        )}
        
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onLike={onLike}
                onUnlike={onUnlike}
                onDelete={onDelete}
                currentUserId={currentUserId}
                isReply={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function CommentSection({
  comments,
  isLoading,
  onAddComment,
  onLikeComment,
  onUnlikeComment,
  onDeleteComment,
  currentUserId,
  className
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    
    setIsSubmitting(true)
    try {
      await onAddComment(newComment)
      setNewComment("")
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    await onAddComment(content, parentId)
  }

  // Show only top-level comments initially, with option to show all
  const topLevelComments = comments.filter(comment => !comment.parent_id)
  const displayedComments = showAllComments ? topLevelComments : topLevelComments.slice(0, 3)

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">Ładowanie komentarzy...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Comments Header */}
      {comments.length > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {comments.length} {comments.length === 1 ? "komentarz" : "komentarzy"}
          </span>
        </div>
      )}
      
      {/* Add Comment Form */}
      <div className="space-y-3">
        <Textarea
          placeholder="Dodaj komentarz..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <Button
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Wysyłanie..." : "Dodaj komentarz"}
        </Button>
      </div>
      
      {/* Comments List */}
      {displayedComments.length > 0 && (
        <div className="space-y-4">
          {displayedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={onLikeComment}
              onUnlike={onUnlikeComment}
              onDelete={onDeleteComment}
              currentUserId={currentUserId}
            />
          ))}
          
          {!showAllComments && topLevelComments.length > 3 && (
            <Button
              variant="ghost"
              onClick={() => setShowAllComments(true)}
              className="w-full text-sm"
            >
              Pokaż wszystkie komentarze ({topLevelComments.length - 3} więcej)
            </Button>
          )}
        </div>
      )}
      
      {comments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Brak komentarzy. Bądź pierwszy!</p>
        </div>
      )}
    </div>
  )
}
