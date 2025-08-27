"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { withTimeout } from "@/lib/errors"

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profile?: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

// Row shape returned by realtime INSERT payload for community_messages
interface RealtimeMessageRow {
  id: string
  content: string
  created_at: string
  user_id: string
  community_id: string
}

interface RealtimeDeleteRow {
  id: string
  community_id: string
}

interface CommunityChatProps {
  communityId: string
  currentUserId: string | null
  userRole: "owner" | "moderator" | "member" | null
}

export function CommunityChat({
  communityId,
  currentUserId,
  userRole,
}: CommunityChatProps) {
  const supabase = getSupabase()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = useCallback(async () => {
    if (!supabase || !communityId) return

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("community_messages")
          .select(
            `
            id,
            content,
            created_at,
            user_id,
            profiles!community_messages_user_id_fkey(username, display_name, avatar_url)
          `,
          )
          .eq("community_id", communityId)
          .order("created_at", { ascending: true })
          .limit(100),
        15000,
      )

      if (error) throw error

      setMessages(
        (data || []).map((msg) => ({
          ...msg,
          profile: Array.isArray(msg.profiles)
            ? msg.profiles[0]
            : msg.profiles || undefined,
        })),
      )
    } catch (error) {
      console.error("Failed to load messages:", error)
      toast.error("Nie udało się wczytać wiadomości")
    } finally {
      setLoading(false)
    }
  }, [supabase, communityId])

  const sendMessage = async () => {
    if (!supabase || !currentUserId || !newMessage.trim()) return

    setSending(true)
    try {
      const { error } = await withTimeout(
        supabase.from("community_messages").insert({
          community_id: communityId,
          user_id: currentUserId,
          content: newMessage.trim(),
        }),
        15000,
      )

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Nie udało się wysłać wiadomości")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    if (!supabase) return

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`community_chat_${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        (payload: RealtimePostgresChangesPayload<RealtimeMessageRow>) => {
          const newMsg = payload.new as RealtimeMessageRow
          // Load profile data for the new message
          supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", newMsg.user_id)
            .single()
            .then(({ data: profile }) => {
              setMessages((prev) => [
                ...prev,
                {
                  ...newMsg,
                  profile: profile || undefined,
                },
              ])
              setTimeout(scrollToBottom, 100)
            })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        (payload: RealtimePostgresChangesPayload<RealtimeDeleteRow>) => {
          const oldRow = payload.old as RealtimeDeleteRow
          setMessages((prev) => prev.filter((msg) => msg.id !== oldRow.id))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, communityId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const deleteMessage = async (messageId: string) => {
    if (!supabase || !userRole || !["owner", "moderator"].includes(userRole))
      return

    try {
      const { error } = await supabase
        .from("community_messages")
        .delete()
        .eq("id", messageId)

      if (error) throw error
    } catch (error) {
      console.error("Failed to delete message:", error)
      toast.error("Nie udało się usunąć wiadomości")
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!currentUserId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Zaloguj się, aby uczestniczyć w czacie społeczności
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Czat społeczności
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                Ładowanie wiadomości...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                Brak wiadomości. Napisz pierwszą!
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.profile?.avatar_url || ""} />
                    <AvatarFallback>
                      {message.profile?.display_name?.[0] ||
                        message.profile?.username?.[0] ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {message.profile?.display_name ||
                          message.profile?.username ||
                          "Nieznany użytkownik"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.created_at)}
                      </span>
                      {userRole &&
                        ["owner", "moderator"].includes(userRole) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 px-1 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteMessage(message.id)}
                          >
                            Usuń
                          </Button>
                        )}
                    </div>
                    <p className="text-sm mt-1 break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Napisz wiadomość..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
