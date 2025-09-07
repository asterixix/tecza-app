"use client"

import { useState, useEffect, useCallback } from "react"
import {
  MessageCircle,
  Reply,
  Heart,
  MoreHorizontal,
  Edit2,
  Trash2,
  SortAsc,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { SkeletonComment } from "@/components/ui/skeleton"

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at?: string
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
  is_edited?: boolean
}

type SortOption = "newest" | "oldest" | "most_liked"

interface CommentSectionProps {
  comments: Comment[]
  isLoading?: boolean
  onAddComment: (content: string, parentId?: string) => Promise<void>
  onLikeComment: (commentId: string) => Promise<void>
  onUnlikeComment: (commentId: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  onEditComment?: (commentId: string, content: string) => Promise<void>
  currentUserId?: string
  className?: string
  maxLength?: number
  enableSorting?: boolean
}

function CommentItem({
  comment,
  onReply,
  onLike,
  onUnlike,
  onDelete,
  onEdit,
  currentUserId,
  isReply = false,
  maxLength = 1000,
}: {
  comment: Comment
  onReply: (parentId: string, content: string) => Promise<void>
  onLike: (commentId: string) => Promise<void>
  onUnlike: (commentId: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  onEdit?: (commentId: string, content: string) => Promise<void>
  currentUserId?: string
  isReply?: boolean
  maxLength?: number
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const { toast } = useToast()

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return

    setIsSubmittingReply(true)
    try {
      await onReply(comment.id, replyContent)
      setReplyContent("")
      setShowReplyForm(false)
      setShowReplies(true)
      toast({
        title: "Odpowiedź dodana",
        description: "Twoja odpowiedź została opublikowana",
      })
    } catch (error) {
      console.error("Error submitting reply:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się dodać odpowiedzi",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) return

    setIsSubmittingEdit(true)
    try {
      await onEdit?.(comment.id, editContent)
      setIsEditing(false)
      toast({
        title: "Komentarz zaktualizowany",
        description: "Zmiany zostały zapisane",
      })
    } catch (error) {
      console.error("Error editing comment:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować komentarza",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingEdit(false)
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
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować polubienia",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    try {
      await onDelete(comment.id)
      toast({
        title: "Komentarz usunięty",
        description: "Komentarz został usunięty",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć komentarza",
        variant: "destructive",
      })
    }
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const commentDate = new Date(date)
    const diffInMinutes = Math.floor(
      (now.getTime() - commentDate.getTime()) / (1000 * 60),
    )

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
            {comment.is_edited && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                edytowany
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
                maxLength={maxLength}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {editContent.length}/{maxLength}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={
                      !editContent.trim() ||
                      isSubmittingEdit ||
                      editContent === comment.content
                    }
                  >
                    {isSubmittingEdit ? "Zapisywanie..." : "Zapisz"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(comment.content)
                    }}
                  >
                    Anuluj
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed break-words">
              {comment.content}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>{timeAgo(comment.created_at)}</span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLikeToggle}
            className={cn(
              "h-auto p-0 text-xs font-medium hover:text-foreground",
              comment.is_liked && "text-red-500",
            )}
          >
            <Heart
              className={cn("h-3 w-3 mr-1", comment.is_liked && "fill-current")}
            />
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
              {showReplies ? "Ukryj" : "Pokaż"} odpowiedzi (
              {comment.replies_count})
            </Button>
          )}

          {(currentUserId === comment.user.id || onDelete || onEdit) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUserId === comment.user.id && onEdit && (
                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edytuj komentarz
                  </DropdownMenuItem>
                )}
                {currentUserId === comment.user.id && onDelete && (
                  <>
                    {onEdit && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Usuń komentarz
                    </DropdownMenuItem>
                  </>
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
              maxLength={maxLength}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {replyContent.length}/{maxLength}
              </span>
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
                onEdit={onEdit}
                currentUserId={currentUserId}
                isReply={true}
                maxLength={maxLength}
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
  onEditComment,
  currentUserId,
  className,
  maxLength = 1000,
  enableSorting = true,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>("newest")
  const [draftComment, setDraftComment] = useState("")
  const { toast } = useToast()

  // Auto-save draft
  useEffect(() => {
    const savedDraft = localStorage.getItem(`comment-draft-${currentUserId}`)
    if (savedDraft && !newComment) {
      setDraftComment(savedDraft)
    }
  }, [currentUserId, newComment])

  useEffect(() => {
    if (newComment !== draftComment) {
      localStorage.setItem(`comment-draft-${currentUserId}`, newComment)
    }
  }, [newComment, draftComment, currentUserId])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await onAddComment(newComment)
      setNewComment("")
      localStorage.removeItem(`comment-draft-${currentUserId}`)
      toast({
        title: "Komentarz dodany",
        description: "Twój komentarz został opublikowany",
      })
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Błąd",
        description: "Nie udało się dodać komentarza",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    await onAddComment(content, parentId)
  }

  // Sort comments based on selected option
  const sortComments = useCallback(
    (comments: Comment[]) => {
      switch (sortOption) {
        case "newest":
          return [...comments].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
        case "oldest":
          return [...comments].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          )
        case "most_liked":
          return [...comments].sort((a, b) => b.likes_count - a.likes_count)
        default:
          return comments
      }
    },
    [sortOption],
  )

  // Show only top-level comments initially, with option to show all
  const topLevelComments = sortComments(
    comments.filter((comment) => !comment.parent_id),
  )
  const displayedComments = showAllComments
    ? topLevelComments
    : topLevelComments.slice(0, 3)

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">Ładowanie komentarzy...</span>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonComment key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Comments Header */}
      {comments.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {comments.length}{" "}
              {comments.length === 1 ? "komentarz" : "komentarzy"}
            </span>
          </div>

          {enableSorting && comments.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                >
                  {sortOption === "newest" && (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {sortOption === "oldest" && (
                    <SortAsc className="h-3 w-3 mr-1" />
                  )}
                  {sortOption === "most_liked" && (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  )}
                  {sortOption === "newest" && "Najnowsze"}
                  {sortOption === "oldest" && "Najstarsze"}
                  {sortOption === "most_liked" && "Najpopularniejsze"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOption("newest")}>
                  <Clock className="h-3 w-3 mr-2" />
                  Najnowsze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("oldest")}>
                  <SortAsc className="h-3 w-3 mr-2" />
                  Najstarsze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("most_liked")}>
                  <TrendingUp className="h-3 w-3 mr-2" />
                  Najpopularniejsze
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Add Comment Form */}
      <div className="space-y-3">
        <div className="relative">
          <Textarea
            placeholder="Dodaj komentarz..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none pr-16"
            maxLength={maxLength}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1 rounded">
            {newComment.length}/{maxLength}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {newComment.length > maxLength * 0.8 && (
              <span className="text-orange-500">
                {Math.round((newComment.length / maxLength) * 100)}%
                wykorzystane
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitComment}
              disabled={
                !newComment.trim() ||
                isSubmitting ||
                newComment.length > maxLength
              }
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Wysyłanie..." : "Dodaj komentarz"}
            </Button>

            {newComment.trim() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewComment("")
                  localStorage.removeItem(`comment-draft-${currentUserId}`)
                }}
              >
                Wyczyść
              </Button>
            )}
          </div>
        </div>
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
              onEdit={onEditComment}
              currentUserId={currentUserId}
              maxLength={maxLength}
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
