"use client"

import { useRouter } from "next/navigation"
import { useMessages } from "@/hooks/use-messages"
import { MessageList } from "@/components/messages/message-list"
import { MessageComposer } from "@/components/messages/message-composer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreVertical } from "lucide-react"
// Supabase client handled inside hooks; useAuth provides the user
import { useAuth } from "@/hooks/use-auth"

interface MessageConversationProps {
  conversationId: string
}

export function MessageConversation({
  conversationId,
}: MessageConversationProps) {
  const router = useRouter()
  const { user } = useAuth()
  const {
    messages,
    conversation,
    loading,
    sendMessage,
    markAsRead,
    requestSecureDelete,
  } = useMessages(conversationId)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Ładowanie...</div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Konwersacja nie znaleziona</h2>
          <Button
            variant="ghost"
            onClick={() => router.push("/m")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do wiadomości
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/m")}
            className="lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {conversation.other_user && (
            <>
              <Avatar>
                <AvatarImage src={conversation.other_user.avatar_url} />
                <AvatarFallback>
                  {conversation.other_user.display_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold">
                  {conversation.other_user.display_name ||
                    conversation.other_user.username}
                </h1>
                <p className="text-xs text-muted-foreground">
                  @{conversation.other_user.username}
                </p>
              </div>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </header>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={user?.id || ""}
        onMarkAsRead={markAsRead}
        onDeleteSecure={requestSecureDelete}
      />

      {/* Composer */}
      <MessageComposer onSendMessage={sendMessage} />
    </div>
  )
}
