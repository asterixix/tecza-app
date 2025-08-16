"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RainbowLikeButtonProps {
  isLiked: boolean
  likesCount: number
  currentUserLike?: {
    rainbow_color: string
  } | null
  onLike: (color: string) => void
  onUnlike: () => void
  className?: string
}

const rainbowColors = [
  { name: "red", color: "text-red-500", bg: "bg-red-500" },
  { name: "orange", color: "text-orange-500", bg: "bg-orange-500" },
  { name: "yellow", color: "text-yellow-500", bg: "bg-yellow-500" },
  { name: "green", color: "text-green-500", bg: "bg-green-500" },
  { name: "blue", color: "text-blue-500", bg: "bg-blue-500" },
  { name: "purple", color: "text-purple-500", bg: "bg-purple-500" },
]

export function RainbowLikeButton({
  isLiked,
  likesCount,
  currentUserLike,
  onLike,
  onUnlike,
  className,
}: RainbowLikeButtonProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [autoIdx, setAutoIdx] = useState(0)

  const handleLike = (color: string) => {
    if (isLiked) {
      onUnlike()
    } else {
      setIsAnimating(true)
      // Auto-rotate color if user hasn't picked one yet
      const chosen = color || rainbowColors[autoIdx % rainbowColors.length].name
      setAutoIdx((i) => (i + 1) % rainbowColors.length)
      onLike(chosen)
      setTimeout(() => setIsAnimating(false), 600)
    }
    setShowColorPicker(false)
  }

  const currentColor =
    currentUserLike?.rainbow_color ||
    rainbowColors[autoIdx % rainbowColors.length].name
  const colorClass =
    rainbowColors.find((c) => c.name === currentColor)?.color || "text-red-500"

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className={cn("gap-2 relative", className)}
        onClick={() => handleLike(currentColor)}
      >
        <Heart
          className={cn(
            "size-4 transition-all duration-300",
            isLiked
              ? `${colorClass} fill-current`
              : "text-muted-foreground hover:text-red-400",
            isAnimating && "animate-bounce scale-125",
          )}
        />
        <span className="text-sm">{likesCount}</span>

        {/* Animated rainbow burst effect */}
        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none">
            {rainbowColors.map((color, i) => (
              <div
                key={color.name}
                className={cn(
                  "absolute w-1 h-1 rounded-full animate-ping",
                  color.bg,
                )}
                style={{
                  left: "50%",
                  top: "50%",
                  animationDelay: `${i * 100}ms`,
                  animationDuration: "600ms",
                  transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-20px)`,
                }}
              />
            ))}
          </div>
        )}
      </Button>

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-popover border rounded-lg shadow-lg z-50">
          <div className="text-xs text-muted-foreground mb-2">
            Wybierz kolor tęczy:
          </div>
          <div className="flex gap-1">
            {rainbowColors.map((color) => (
              <button
                key={color.name}
                onClick={() => handleLike(color.name)}
                className={cn(
                  "w-6 h-6 rounded-full transition-transform hover:scale-110",
                  color.bg,
                )}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
