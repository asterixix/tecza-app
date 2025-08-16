"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { MessageEncryption } from "@/lib/crypto/message-encryption"
import { KeyManager } from "@/lib/crypto/key-manager"
import { MediaProcessor } from "@/lib/media/media-processor"
import { RealtimeChannel } from "@supabase/supabase-js"

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  type: "text" | "image" | "video" | "file"
  content?: string // Decrypted content
  media_url?: string // Decrypted media URL
  media_mime?: string
  media_size?: number
  is_read: boolean
  read_at?: string
  created_at: string
  sender?: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

interface Conversation {
  id: string
  type: "direct" | "group"
  participants: string[]
  wrapped_keys: Record<string, string>
  last_message_at: string
  created_at: string
  other_user?: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }
}

export function useMessages(conversationId?: string) {
  const supabase = getSupabase()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const conversationKeyRef = useRef<CryptoKey | null>(null)

  // Load conversation and decrypt keys
  const loadConversation = useCallback(async () => {
    if (!conversationId) return

    try {
      const {
        data: { user },
      } = await supabase!.auth.getUser()
      if (!user) return

      // Get conversation with participant info
      const { data: conv, error } = await supabase!
        .from("conversations")
        .select(
          `
          *,
          profiles!conversations_participants_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `
        )
        .eq("id", conversationId)
        .single()

      if (error) throw error

      // Find other participant for direct messages
      let convWithOther = conv as Conversation
      if (conv.type === "direct") {
        const otherUserId = conv.participants.find((p: string) => p !== user.id)
        const profilesTyped:
          | Array<{ id: string; username: string; display_name: string; avatar_url?: string }>
          | undefined = (
          conv as unknown as {
            profiles?: Array<{
              id: string
              username: string
              display_name: string
              avatar_url?: string
            }>
          }
        ).profiles
        const otherUser = profilesTyped?.find((p) => p.id === otherUserId)
        convWithOther = { ...conv, other_user: otherUser } as Conversation
      }

      // Decrypt conversation key
      const wrappedKey = convWithOther.wrapped_keys[user.id]
      if (wrappedKey) {
        // Try to unwrap with private key first (RSA), else fallback to raw AES key
        const priv = KeyManager.getPrivateKey()
        if (priv) {
          try {
            conversationKeyRef.current = await MessageEncryption.unwrapKey(wrappedKey, priv)
          } catch {
            conversationKeyRef.current = await MessageEncryption.importKey(wrappedKey)
          }
        } else {
          try {
            conversationKeyRef.current = await MessageEncryption.importKey(wrappedKey)
          } catch (e) {
            console.error("Failed to import conversation key", e)
          }
        }
      }

      setConversation(convWithOther)
    } catch (error) {
      console.error("Failed to load conversation:", error)
    }
  }, [conversationId, supabase])

  // Load and decrypt messages
  const loadMessages = useCallback(async () => {
    if (!conversationId || !conversationKeyRef.current) return

    setLoading(true)
    try {
      const { data, error } = await supabase!
        .from("direct_messages")
        .select(
          `
          *,
          profiles:sender_id (
            username,
            display_name,
            avatar_url
          )
        `
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error

      // Decrypt messages
      const decryptedMessages = await Promise.all(
        data.map(async (msg) => {
          const decrypted: Message = {
            ...msg,
            sender: msg.profiles,
          }

          // Decrypt text content
          if (msg.type === "text" && msg.content_cipher && msg.iv) {
            try {
              decrypted.content = await MessageEncryption.decryptText(
                msg.content_cipher,
                msg.iv,
                conversationKeyRef.current!
              )
            } catch (e) {
              console.error("Failed to decrypt message:", e)
              decrypted.content = "[Unable to decrypt]"
            }
          }

          // Handle media (decrypt URL if needed)
          if (msg.media_path) {
            const bucket =
              msg.type === "image"
                ? "message-images"
                : msg.type === "video"
                  ? "message-videos"
                  : "message-files"
            const { data: urlData } = await supabase!.storage
              .from(bucket)
              .createSignedUrl(msg.media_path, 60 * 60) // 1 hour
            decrypted.media_url = urlData?.signedUrl
          }

          return decrypted
        })
      )

      setMessages(decryptedMessages)
    } catch (error) {
      console.error("Failed to load messages:", error)
    } finally {
      setLoading(false)
    }
  }, [conversationId, supabase])

  // Send encrypted message
  const sendMessage = useCallback(
    async (content?: string, file?: File, type: "text" | "image" | "video" | "file" = "text") => {
      if (!conversationId || !conversationKeyRef.current) return
      if (!content && !file) return

      setSending(true)
      try {
        const {
          data: { user },
        } = await supabase!.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        const messageData: Record<string, unknown> = {
          conversation_id: conversationId,
          sender_id: user.id,
          type,
        }

        // Encrypt text content
        if (content) {
          const encrypted = await MessageEncryption.encryptText(content, conversationKeyRef.current)
          messageData.content_cipher = encrypted.cipher
          messageData.iv = encrypted.iv
        }

        // Process and encrypt file
        if (file) {
          let processedFile: Blob = file

          // Process media
          if (type === "image") {
            processedFile = await MediaProcessor.processImage(file)
          } else if (type === "video") {
            processedFile = await MediaProcessor.processVideo(file)
          } else {
            MediaProcessor.validateFile(file)
          }

          // Encrypt file
          const arrayBuffer = await processedFile.arrayBuffer()
          const encrypted = await MessageEncryption.encryptFile(
            arrayBuffer,
            conversationKeyRef.current
          )

          // Upload to storage
          const fileName = `${user.id}/${Date.now()}_${file.name}`
          const bucket =
            type === "image"
              ? "message-images"
              : type === "video"
                ? "message-videos"
                : "message-files"

          const { error: uploadError } = await supabase!.storage
            .from(bucket)
            .upload(fileName, new Blob([encrypted.cipher]), {
              contentType: processedFile.type,
            })

          if (uploadError) throw uploadError

          let finalPath = fileName
          if (type === "video") {
            // Ask Edge Function to transcode the uploaded blob to webm
            try {
              const resp = await fetch("/api/video-transcode", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ bucket, path: fileName }),
              })
              const res = await resp.json().catch(() => ({}))
              if (res?.ok && res.outputPath) {
                finalPath = res.outputPath as string
              }
            } catch (e) {
              console.warn("transcode failed", e)
            }
          }

          messageData.media_path = finalPath
          messageData.media_mime = processedFile.type
          messageData.media_size = processedFile.size
          messageData.iv = encrypted.iv // Store IV for file decryption
        }

        // Insert message
        type InsertMessage = {
          conversation_id: string
          sender_id: string
          type: "text" | "image" | "video" | "file"
          content_cipher?: string
          iv?: string
          media_path?: string
          media_mime?: string
          media_size?: number
        }
        const { error } = await supabase!
          .from("direct_messages")
          .insert(messageData as InsertMessage)

        if (error) throw error

        // Update conversation last message time
        await supabase!
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId)
      } catch (error) {
        console.error("Failed to send message:", error)
        throw error
      } finally {
        setSending(false)
      }
    },
    [conversationId, supabase]
  )

  // Mark messages as read
  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      if (!messageIds.length) return

      try {
        await supabase!
          .from("direct_messages")
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .in("id", messageIds)
      } catch (error) {
        console.error("Failed to mark messages as read:", error)
      }
    },
    [supabase]
  )

  // Secure delete request (marks for purge via SQL function)
  const requestSecureDelete = useCallback(
    async (messageId: string) => {
      try {
        await supabase!.rpc("request_message_purge", { msg_id: messageId })
        // Optimistically remove from UI
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      } catch (e) {
        console.error("Failed to request secure delete", e)
        throw e
      }
    },
    [supabase]
  )

  // Setup realtime subscription
  useEffect(() => {
    if (!conversationId) return

    // Load initial data
    loadConversation()
    loadMessages()

    // Setup realtime subscription
    channelRef.current = supabase!
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Decrypt and add new message
          if (conversationKeyRef.current && payload.new) {
            const msg = payload.new as {
              id: string
              sender_id: string
              type: "text" | "image" | "video" | "file"
              content_cipher?: string
              iv?: string
              media_path?: string
              created_at: string
            }

            // Load sender info
            const { data: sender } = await supabase!
              .from("profiles")
              .select("username, display_name, avatar_url")
              .eq("id", msg.sender_id)
              .single()

            const decrypted: Message = {
              id: msg.id,
              conversation_id: conversationId!,
              sender_id: msg.sender_id,
              type: msg.type,
              is_read: false,
              created_at: msg.created_at,
              sender: sender ?? { username: "", display_name: "" },
            } as Message

            // Decrypt content if needed
            if (msg.type === "text" && msg.content_cipher && msg.iv) {
              try {
                decrypted.content = await MessageEncryption.decryptText(
                  msg.content_cipher,
                  msg.iv,
                  conversationKeyRef.current
                )
              } catch {
                decrypted.content = "[Unable to decrypt]"
              }
            }

            setMessages((prev) => [...prev, decrypted])
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Update message (e.g., mark as read)
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
          )
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase!.removeChannel(channelRef.current)
      }
    }
  }, [conversationId, supabase, loadConversation, loadMessages])

  return {
    messages,
    conversation,
    loading,
    sending,
    sendMessage,
    markAsRead,
    requestSecureDelete,
    refetch: loadMessages,
  }
}

// Hook to get or create conversation
export function useConversation(otherUserId?: string) {
  const supabase = getSupabase()
  const [loading, setLoading] = useState(false)

  const getOrCreateConversation = useCallback(async (): Promise<string | null> => {
    if (!otherUserId) return null

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase!.auth.getUser()
      if (!user) return null

      // Check if conversation exists
      const { data: existing } = await supabase!
        .from("conversations")
        .select("id")
        .eq("type", "direct")
        .contains("participants", [user.id, otherUserId])
        .single()

      if (existing) return existing.id

      // Check if users are friends
      const { data: friendship } = await supabase!
        .from("friendships")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${otherUserId},user2_id.eq.${otherUserId}`)
        .eq("status", "active")
        .single()

      if (!friendship) {
        throw new Error("You must be friends to send messages")
      }

      // Generate conversation key
      const conversationKey = await MessageEncryption.generateKey()

      // Get users' public keys and wrap the conversation key when possible
      const wrappedKeys: Record<string, string> = {}
      const { data: keyProfiles } = await supabase!
        .from("profiles")
        .select("id, public_key")
        .in("id", [user.id, otherUserId])

      const byId: Record<string, { public_key: string | null }> = {}
      ;(keyProfiles as Array<{ id: string; public_key: string | null }> | null)?.forEach((p) => {
        byId[p.id] = { public_key: p.public_key }
      })

      // Fallback: export raw AES key if public key missing
      for (const uid of [user.id, otherUserId]) {
        const pub = byId[uid]?.public_key
        if (pub) {
          try {
            const pubKey = await MessageEncryption.importPublicKey(pub)
            const wrapped = await MessageEncryption.wrapKey(conversationKey, pubKey)
            wrappedKeys[uid] = wrapped
            continue
          } catch {}
        }
        wrappedKeys[uid] = await MessageEncryption.exportKey(conversationKey)
      }

      // Create new conversation
      const { data: newConv, error } = await supabase!
        .from("conversations")
        .insert({
          type: "direct",
          participants: [user.id, otherUserId],
          wrapped_keys: wrappedKeys,
        })
        .select("id")
        .single()

      if (error) throw error
      return newConv.id
    } catch (error) {
      console.error("Failed to get/create conversation:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [otherUserId, supabase])

  return { getOrCreateConversation, loading }
}
