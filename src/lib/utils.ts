import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a URL-friendly slug from a string. Removes diacritics and unsafe chars.
export function slugify(input: string, maxLength = 72): string {
  const normalized = input
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // strip accents
    .toLowerCase()
  const slug = normalized
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanum
    .trim()
    .replace(/\s+/g, '-') // spaces to dashes
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+|-+$/g, '') // trim dashes
  return slug.slice(0, maxLength)
}
