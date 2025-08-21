import type { PostgrestError } from "@supabase/supabase-js"

export type NormalizedError = {
  message: string
  code?: string
  hint?: string | null
  details?: string | null
  status?: number
  statusText?: string
}

export function normalizeSupabaseError(
  e: unknown,
  fallback = "Wystąpił nieoczekiwany błąd",
  ctx?: { status?: number; statusText?: string },
): NormalizedError {
  const err = (e || {}) as Partial<PostgrestError> & { message?: string }
  const message = err.message || fallback
  return {
    message,
    code: (err as PostgrestError).code,
    hint: (err as PostgrestError).hint ?? null,
    details: (err as PostgrestError).details ?? null,
    status: ctx?.status,
    statusText: ctx?.statusText,
  }
}

export function isRetryable(err: NormalizedError): boolean {
  // Simple heuristic: network errors or 5xx
  if (!err) return false
  if (err.status && err.status >= 500) return true
  // Postgres: 40001 serialization failure, 55P03 lock not available
  return err.code === "40001" || err.code === "55P03"
}

export function friendlyMessage(err: NormalizedError): string {
  // Map common constraint violations
  if (err.code === "23505") {
    return "Rekord już istnieje (duplikat). Zmień nazwę/slug i spróbuj ponownie."
  }
  if (err.code === "42501" || err.status === 403) {
    return "Brak uprawnień do wykonania tej operacji."
  }
  if (err.status === 404) {
    return "Nie znaleziono zasobu."
  }
  return err.message
}

/** Convert unknown error into a NormalizedError with optional HTTP context */
export function toNormalizedError(
  e: unknown,
  fallback = "Wystąpił nieoczekiwany błąd",
  ctx?: { status?: number; statusText?: string },
): NormalizedError {
  return normalizeSupabaseError(e, fallback, ctx)
}

/** Human friendly message alias */
export function toUserMessage(err: NormalizedError): string {
  return friendlyMessage(err)
}

/** Run a promise with a timeout to avoid hanging UI */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = 15000,
  onTimeoutMessage = "Przekroczono limit czasu operacji",
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(onTimeoutMessage)), ms)
    })
    // Race promise with timeout
    const result = await Promise.race([promise, timeout])
    return result as T
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

/**
 * Consistent action wrapper that returns data or throws an Error with a user-friendly message.
 * Use in UI actions to reduce repeated try/catch boilerplate.
 */
export async function safeAction<T>(
  run: () =>
    | Promise<{
        data: T | null
        error: unknown
        status?: number
        statusText?: string
      }>
    | Promise<T>,
  fallback = "Operacja nie powiodła się",
  { timeoutMs }: { timeoutMs?: number } = {},
): Promise<T> {
  const exec = async () => {
    const res = await run()
    // Allow passing a bare T from custom code
    if (
      res &&
      typeof res === "object" &&
      !("error" in (res as object)) &&
      !("data" in (res as object))
    ) {
      return res as T
    }
    const { data, error, status, statusText } = (res || {}) as {
      data: T | null
      error: unknown
      status?: number
      statusText?: string
    }
    if (error) {
      const err = normalizeSupabaseError(error, fallback, {
        status,
        statusText,
      })
      throw new Error(friendlyMessage(err))
    }
    if (data == null) {
      throw new Error(fallback)
    }
    return data
  }
  return timeoutMs ? withTimeout(exec(), timeoutMs) : exec()
}
