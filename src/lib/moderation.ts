export type ModerationDecision = {
  decision: "allow" | "review" | "block"
  categories?: string[]
  severity?: "low" | "medium" | "high"
  reasons?: string[]
  suggestions?: string[]
}

export async function moderateContent(input: {
  type: "post" | "profile" | "event" | "community" | "comment" | "message"
  content: string
  locale?: string
}): Promise<ModerationDecision | null> {
  try {
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    const j = await res.json()
    return j?.result as ModerationDecision
  } catch {
    return null
  }
}
