import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "default" | "shimmer" | "pulse" | "wave"
  size?: "sm" | "md" | "lg" | "xl"
  shape?: "rect" | "circle" | "rounded"
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    { className, variant = "shimmer", size = "md", shape = "rect", ...props },
    ref,
  ) => {
    const sizeClasses = {
      sm: "h-3",
      md: "h-4",
      lg: "h-6",
      xl: "h-8",
    }

    const shapeClasses = {
      rect: "rounded-md",
      circle: "rounded-full",
      rounded: "rounded-lg",
    }

    const variantClasses = {
      default: "bg-accent animate-pulse",
      shimmer:
        "bg-gradient-to-r from-accent via-accent/50 to-accent animate-shimmer",
      pulse: "bg-accent animate-pulse",
      wave: "bg-gradient-to-r from-accent via-accent/30 to-accent animate-wave",
    }

    return (
      <div
        ref={ref}
        data-slot="skeleton"
        className={cn(
          "relative overflow-hidden",
          sizeClasses[size],
          shapeClasses[shape],
          variantClasses[variant],
          className,
        )}
        role="status"
        aria-label="Ładowanie..."
        {...props}
      />
    )
  },
)

Skeleton.displayName = "Skeleton"

// Specialized skeleton components
const SkeletonText = forwardRef<
  HTMLDivElement,
  SkeletonProps & { lines?: number }
>(({ className, lines = 1, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "w-full",
          i === lines - 1 && "w-3/4", // Last line is shorter
        )}
        {...props}
      />
    ))}
  </div>
))

SkeletonText.displayName = "SkeletonText"

const SkeletonAvatar = forwardRef<
  HTMLDivElement,
  SkeletonProps & { size?: "sm" | "md" | "lg" }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  return (
    <Skeleton
      ref={ref}
      className={cn(sizeClasses[size], className)}
      shape="circle"
      {...props}
    />
  )
})

SkeletonAvatar.displayName = "SkeletonAvatar"

const SkeletonCard = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-3 p-4 border rounded-lg", className)}
      {...props}
    >
      <div className="flex items-center space-x-3">
        <SkeletonAvatar size="md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-1/6" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  ),
)

SkeletonCard.displayName = "SkeletonCard"

const SkeletonPost = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-4 p-4 border rounded-lg", className)}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SkeletonAvatar size="md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/5" />
        </div>
        <Skeleton className="h-4 w-4" />
      </div>

      {/* Content */}
      <SkeletonText lines={4} />

      {/* Media placeholder */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex space-x-4">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-6 w-6" />
      </div>
    </div>
  ),
)

SkeletonPost.displayName = "SkeletonPost"

const SkeletonComment = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-3", className)} {...props}>
      <div className="flex space-x-3">
        <SkeletonAvatar size="sm" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <SkeletonText lines={2} />
          <div className="flex space-x-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  ),
)

SkeletonComment.displayName = "SkeletonComment"

const SkeletonProfile = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-4 p-6 border rounded-lg", className)}
      {...props}
    >
      {/* Cover image */}
      <Skeleton className="h-32 w-full rounded-lg" />

      {/* Profile info */}
      <div className="flex items-start space-x-4 -mt-16 relative z-10">
        <SkeletonAvatar size="lg" className="border-4 border-background" />
        <div className="space-y-2 flex-1 pt-16">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <SkeletonText lines={2} />
        </div>
      </div>

      {/* Stats */}
      <div className="flex space-x-6 pt-4 border-t">
        <div className="text-center">
          <Skeleton className="h-6 w-8 mx-auto mb-1" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-6 w-8 mx-auto mb-1" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-6 w-8 mx-auto mb-1" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
      </div>
    </div>
  ),
)

SkeletonProfile.displayName = "SkeletonProfile"

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonPost,
  SkeletonComment,
  SkeletonProfile,
}
