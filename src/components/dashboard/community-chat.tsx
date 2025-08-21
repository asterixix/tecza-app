"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Hash,
  Send,
  Plus,
  Users,
  MessageCircle,
  MoreVertical,
  Edit3,
  Trash2,
  Shield,
  Crown,
  Megaphone,
} from "lucide-react"
import { toast } from "sonner"
import { withTimeout } from "@/lib/errors"

interface ChatChannel {
  id: string
  name: string
  description: string | null
  type: "text" | "voice" | "announcement"
  is_private: boolean
  allowed_roles: string[]
  created_by: string
  created_at: string
}

interface ChatMessage {
  id: string
  channel_id: string
  user_id: string
  content: string
  type: "text" | "image" | "file" | "system"
  media_url: string | null
  file_name: string | null
  reply_to: string | null
  edited_at: string | null
  created_at: string
  user?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface CommunityMember {
  id: string
  user_id: string
  role: "owner" | "moderator" | "member"
  user: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface CommunityChatProps {
  communityId: string
  currentUserId: string | null
  userRole?: "owner" | "moderator" | "member"
}

export function CommunityChat({
  communityId,
  currentUserId,
  userRole = "member",
}: CommunityChatProps) {
  const supabase = getSupabase()
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelDescription, setNewChannelDescription] = useState("")
  const [newChannelType, setNewChannelType] = useState<"text" | "announcement">(
    "text",
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Load channels
  useEffect(() => {
    async function loadChannels() {
      if (!supabase || !communityId) return

      const { data, error } = await withTimeout(
        supabase
          .from("community_chat_channels")
          .select("*")
          .eq("community_id", communityId)
          .order("created_at", { ascending: true }),
        15000,
      )

      if (error) {
        console.error("Error loading channels:", error)
        toast.error("Nie udało się załadować kanałów")
      } else {
        setChannels(data || [])
        if (data && data.length > 0 && !activeChannel) {
          setActiveChannel(data[0])
        }
      }
      setIsLoading(false)
    }

    loadChannels()
  }, [supabase, communityId, activeChannel])

  // Load messages for active channel
  useEffect(() => {
    async function loadMessages() {
      if (!supabase || !activeChannel) return

      const { data, error } = await withTimeout(
        supabase
          .from("community_chat_messages")
          .select(
            `
            *,
            user:profiles (
              username,
              display_name,
              avatar_url
            )
          `,
          )
          .eq("channel_id", activeChannel.id)
          .order("created_at", { ascending: true })
          .limit(100),
        15000,
      )

      if (error) {
        console.error("Error loading messages:", error)
        toast.error("Nie udało się załadować wiadomości")
      } else {
        setMessages(data || [])
        setTimeout(scrollToBottom, 100)
      }
    }

    loadMessages()
  }, [supabase, activeChannel, scrollToBottom])

  // Load community members
  useEffect(() => {
    async function loadMembers() {
      if (!supabase || !communityId) return

      const { data, error } = await withTimeout(
        supabase
          .from("community_memberships")
          .select(
            `
            *,
            user:profiles (
              username,
              display_name,
              avatar_url
            )
          `,
          )
          .eq("community_id", communityId)
          .order("role", { ascending: false }),
        15000,
      )

      if (error) {
        console.error("Error loading members:", error)
      } else {
        setMembers(data || [])
      }
    }

    loadMembers()
  }, [supabase, communityId])

  // Real-time subscriptions
  useEffect(() => {
    if (!supabase || !activeChannel) return

    const messageSubscription = supabase
      .channel(`chat-messages-${activeChannel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_chat_messages",
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage

          // Fetch user data for the new message
          const { data: userData } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", newMessage.user_id)
            .single()

          const messageWithUser: ChatMessage = {
            ...newMessage,
            user: userData || undefined,
          }

          setMessages((prev) => [...prev, messageWithUser])
          setTimeout(scrollToBottom, 100)
        },
      )
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
    }
  }, [supabase, activeChannel, scrollToBottom])

  // Send message
  const sendMessage = async () => {
    if (!supabase || !currentUserId || !activeChannel || !messageInput.trim())
      return

    setIsSending(true)
    try {
      const { error } = await supabase.from("community_chat_messages").insert({
        channel_id: activeChannel.id,
        user_id: currentUserId,
        content: messageInput.trim(),
        type: "text",
      })

      if (error) throw error

      setMessageInput("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Nie udało się wysłać wiadomości")
    } finally {
      setIsSending(false)
    }
  }

  // Create new channel
  const createChannel = async () => {
    if (!supabase || !currentUserId || !newChannelName.trim()) return

    try {
      const { error } = await supabase.from("community_chat_channels").insert({
        community_id: communityId,
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || null,
        type: newChannelType,
        created_by: currentUserId,
      })

      if (error) throw error

      toast.success("Kanał utworzony")
      setShowCreateChannel(false)
      setNewChannelName("")
      setNewChannelDescription("")
      setNewChannelType("text")

      // Reload channels
      const { data } = await supabase
        .from("community_chat_channels")
        .select("*")
        .eq("community_id", communityId)
        .order("created_at", { ascending: true })

      setChannels(data || [])
    } catch (error) {
      console.error("Error creating channel:", error)
      toast.error("Nie udało się utworzyć kanału")
    }
  }

  // Handle textarea resize
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setMessageInput(textarea.value)

    // Auto-resize
    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getChannelIcon = (channel: ChatChannel) => {
    switch (channel.type) {
      case "announcement":
        return <Megaphone className="w-4 h-4" />
      case "voice":
        return <MessageCircle className="w-4 h-4" />
      default:
        return <Hash className="w-4 h-4" />
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-3 h-3 text-yellow-500" />
      case "moderator":
        return <Shield className="w-3 h-3 text-blue-500" />
      default:
        return null
    }
  }

  const canManageChannels = userRole === "owner" || userRole === "moderator"

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Ładowanie czatu...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-[600px] flex border rounded-lg overflow-hidden">
      {/* Channels Sidebar */}
      <div className="w-64 bg-muted/50 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Kanały</h3>
            {canManageChannels && (
              <Dialog
                open={showCreateChannel}
                onOpenChange={setShowCreateChannel}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Utwórz kanał</DialogTitle>
                    <DialogDescription>
                      Dodaj nowy kanał do społeczności
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Nazwa kanału
                      </label>
                      <Input
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="np. ogólny"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Opis (opcjonalny)
                      </label>
                      <Textarea
                        value={newChannelDescription}
                        onChange={(e) =>
                          setNewChannelDescription(e.target.value)
                        }
                        placeholder="Opis kanału"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Typ kanału</label>
                      <select
                        value={newChannelType}
                        onChange={(e) =>
                          setNewChannelType(
                            e.target.value as "text" | "announcement",
                          )
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="text">Tekstowy</option>
                        <option value="announcement">Ogłoszenia</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateChannel(false)}
                      >
                        Anuluj
                      </Button>
                      <Button onClick={createChannel}>Utwórz</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`w-full flex items-center gap-2 p-2 rounded hover:bg-accent text-left ${
                  activeChannel?.id === channel.id ? "bg-accent" : ""
                }`}
              >
                {getChannelIcon(channel)}
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Members List */}
        <div className="border-t p-4">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Członkowie ({members.length})
          </h4>
          <ScrollArea className="h-32">
            <div className="space-y-1">
              {members.slice(0, 10).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={member.user.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.user.display_name?.[0] ||
                        member.user.username[0] ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate flex-1">
                    {member.user.display_name || member.user.username}
                  </span>
                  {getRoleIcon(member.role)}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            {/* Channel Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getChannelIcon(activeChannel)}
                  <div>
                    <h3 className="font-semibold">{activeChannel.name}</h3>
                    {activeChannel.description && (
                      <p className="text-sm text-muted-foreground">
                        {activeChannel.description}
                      </p>
                    )}
                  </div>
                </div>
                {canManageChannels && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edytuj kanał
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Usuń kanał
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={message.user?.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {message.user?.display_name?.[0] ||
                          message.user?.username[0] ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.user?.display_name || message.user?.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder={`Napisz wiadomość na #${activeChannel.name}...`}
                    className="min-h-[40px] max-h-[120px] resize-none pr-12"
                    disabled={!currentUserId}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isSending || !currentUserId}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Wybierz kanał aby rozpocząć rozmowę</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
