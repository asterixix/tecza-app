"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import { FileText, Download, Check, CheckCheck } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  sender_id: string
  type: "text" | "image" | "video" | "file"
  content?: string
  media_url?: string
  media_mime?: string
  media_size?: number
  is_read: boolean
  created_at: string
  sender?: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  onMarkAsRead?: (messageIds: string[]) => void
  onDeleteSecure?: (messageId: string) => void
}

export function MessageList({
  messages,
  currentUserId,
  onMarkAsRead,
  onDeleteSecure,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Mark visible messages as read
  useEffect(() => {
    if (!onMarkAsRead) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleUnreadIds = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.getAttribute("data-message-id"))
          .filter((id): id is string => {
            const msg = messages.find((m) => m.id === id)
            return !!msg && !msg.is_read && msg.sender_id !== currentUserId
          })

        if (visibleUnreadIds.length > 0) {
          onMarkAsRead(visibleUnreadIds)
        }
      },
      { threshold: 0.5 },
    )

    const messageElements =
      containerRef.current?.querySelectorAll("[data-message-id]")
    messageElements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [messages, currentUserId, onMarkAsRead])

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case "text":
        return (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )

      case "image":
        return message.media_url ? (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block max-w-sm rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          >
            <Image
              src={message.media_url}
              alt="Wysłany obraz"
              width={640}
              height={640}
              className="h-auto w-full"
            />
          </a>
        ) : null

      case "video":
        return message.media_url ? (
          <video
            src={message.media_url}
            controls
            className="max-w-sm rounded-lg"
          />
        ) : null

      case "file":
        return message.media_url ? (
          <a
            href={message.media_url}
            download
            className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3 hover:bg-muted transition-colors"
          >
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.media_url.split("/").pop()}
              </p>
              {message.media_size && (
                <p className="text-xs text-muted-foreground">
                  {(message.media_size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </a>
        ) : null
    }
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwn = message.sender_id === currentUserId

        return (
          <div
            key={message.id}
            data-message-id={message.id}
            className={cn(
              "flex gap-3",
              isOwn ? "flex-row-reverse" : "flex-row",
            )}
          >
            {/* Avatar */}
            {!isOwn && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={message.sender?.avatar_url} />
                <AvatarFallback>
                  {message.sender?.display_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Message bubble */}
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2",
                isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {/* Sender name (for group chats) */}
              {!isOwn && message.sender && (
                <p className="text-xs font-medium mb-1 opacity-70">
                  {message.sender.display_name || message.sender.username}
                </p>
              )}

              {/* Message content */}
              {renderMessageContent(message)}

              {/* Timestamp and read status */}
              <div
                className={cn(
                  "flex items-center gap-1 mt-1",
                  isOwn ? "justify-end" : "justify-start",
                )}
              >
                <span className="text-xs opacity-60">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                    locale: pl,
                  })}
                </span>
                {isOwn &&
                  (message.is_read ? (
                    <CheckCheck className="h-3 w-3 opacity-60" />
                  ) : (
                    <Check className="h-3 w-3 opacity-60" />
                  ))}
                {isOwn && onDeleteSecure && (
                  <button
                    type="button"
                    className="ml-2 text-[10px] underline opacity-70 hover:opacity-100"
                    onClick={() => onDeleteSecure(message.id)}
                    aria-label="Usuń bezpiecznie"
                  >
                    Usuń bezpiecznie
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
