"use client"
import NextImage from "next/image"

import { useState, useRef, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Smile,
  X,
} from "lucide-react"
import { MediaProcessor } from "@/lib/media/media-processor"
import { useToast } from "@/hooks/use-toast"

interface MessageComposerProps {
  onSendMessage: (
    content?: string,
    file?: File,
    type?: "text" | "image" | "video" | "file"
  ) => Promise<void>
  disabled?: boolean
}

export function MessageComposer({ onSendMessage, disabled }: MessageComposerProps) {
  const [message, setMessage] = useState("")
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const emojiList = [
    "😀",
    "😂",
    "🥰",
    "😊",
    "😉",
    "😍",
    "😘",
    "😎",
    "😭",
    "😅",
    "👍",
    "🙏",
    "🎉",
    "🔥",
    "✨",
    "💖",
    "💪",
    "🥳",
    "👏",
    "🤝",
  ]

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Validate file size
      MediaProcessor.validateFile(file)

      setAttachedFile(file)

      // Generate preview
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const preview = await MediaProcessor.generateThumbnail(file)
        setFilePreview(preview)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nieoczekiwany błąd"
      toast({
        title: "Błąd",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleSend = async () => {
    if (!message.trim() && !attachedFile) return
    if (sending || disabled) return

    setSending(true)
    try {
      let type: "text" | "image" | "video" | "file" = "text"

      if (attachedFile) {
        if (attachedFile.type.startsWith("image/")) type = "image"
        else if (attachedFile.type.startsWith("video/")) type = "video"
        else type = "file"
      }

      await onSendMessage(message || undefined, attachedFile || undefined, type)

      // Clear form
      setMessage("")
      setAttachedFile(null)
      setFilePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać wiadomości",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: { native: string }) => {
    setMessage((prev) => prev + emoji.native)
  }

  const removeAttachment = () => {
    setAttachedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="border-t bg-background p-4">
      {/* File preview */}
      {attachedFile && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border bg-muted p-2">
          {filePreview ? (
            <div className="h-12 w-12 overflow-hidden rounded relative">
              <NextImage
                src={filePreview}
                alt="Podgląd pliku"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          ) : (
            <FileText className="h-12 w-12 text-muted-foreground" />
          )}
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{attachedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={removeAttachment} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Napisz wiadomość..."
            disabled={disabled || sending}
            className="min-h-[56px] resize-none pr-24"
            rows={1}
          />

          {/* Emoji and attachment buttons */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={disabled || sending}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="grid grid-cols-8 gap-1">
                  {emojiList.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="h-8 w-8 rounded hover:bg-muted text-lg"
                      onClick={() => handleEmojiSelect({ native: e })}
                      aria-label={`Wstaw emotikonę ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={disabled || sending || !!attachedFile}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="grid gap-2">
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      fileInputRef.current?.click()
                      fileInputRef.current?.setAttribute("accept", "image/*")
                    }}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Zdjęcie
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      fileInputRef.current?.click()
                      fileInputRef.current?.setAttribute("accept", "video/*")
                    }}
                  >
                    <VideoIcon className="mr-2 h-4 w-4" />
                    Wideo
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      fileInputRef.current?.click()
                      fileInputRef.current?.removeAttribute("accept")
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Plik
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || sending || (!message.trim() && !attachedFile)}
          className="h-[56px]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
    </div>
  )
}
