"use client"

import {
  Skeleton,
  SkeletonAvatar,
  SkeletonText,
  SkeletonCard,
  SkeletonPost,
  SkeletonComment,
  SkeletonProfile,
} from "./skeleton"
import { cn } from "@/lib/utils"

// Loading states for different components
export function FeedLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonPost key={i} />
      ))}
    </div>
  )
}

export function CommentsLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonComment key={i} />
      ))}
    </div>
  )
}

export function ProfileLoadingState() {
  return (
    <div className="space-y-6">
      <SkeletonProfile />
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonPost key={i} />
        ))}
      </div>
    </div>
  )
}

export function CommunityLoadingState() {
  return (
    <div className="space-y-6">
      {/* Community header */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start space-x-4">
          <SkeletonAvatar size="lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <SkeletonText lines={2} />
          </div>
        </div>
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Community content */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonPost key={i} />
        ))}
      </div>
    </div>
  )
}

export function EventsLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SearchResultsLoadingState() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-3 p-3 border rounded-lg"
            >
              <SkeletonAvatar size="sm" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function NotificationLoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-3 p-3 border rounded-lg"
        >
          <SkeletonAvatar size="sm" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  )
}

// Generic loading wrapper
export function LoadingWrapper({
  children,
  isLoading,
  loadingComponent,
  className,
}: {
  children: React.ReactNode
  isLoading: boolean
  loadingComponent: React.ReactNode
  className?: string
}) {
  if (isLoading) {
    return <div className={className}>{loadingComponent}</div>
  }

  return <>{children}</>
}

// Progressive loading component
export function ProgressiveLoading({
  stages,
  currentStage,
}: {
  stages: Array<{
    name: string
    component: React.ReactNode
    duration?: number
  }>
  currentStage: number
}) {
  const currentStageData = stages[currentStage] || stages[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="flex space-x-1">
          {stages.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full",
                i <= currentStage ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
        <span>{currentStageData.name}</span>
      </div>
      {currentStageData.component}
    </div>
  )
}

// Error state component
export function ErrorState({
  title = "Wystąpił błąd",
  description = "Spróbuj ponownie za chwilę",
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn("text-center py-8", className)}>
      <div className="text-destructive mb-2">
        <svg
          className="h-8 w-8 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Spróbuj ponownie
        </button>
      )}
    </div>
  )
}

// Empty state component
export function EmptyState({
  title = "Brak danych",
  description = "Nie ma nic do wyświetlenia",
  icon,
  action,
  className,
}: {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("text-center py-8", className)}>
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  )
}
