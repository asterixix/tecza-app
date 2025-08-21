// Shared profile-related TypeScript types
// Keep in sync with database enum/allowed values

export type ProfileVisibility = "public" | "friends" | "private"

export const PROFILE_VISIBILITIES = ["public", "friends", "private"] as const
