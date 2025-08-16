import { NextRequest, NextResponse } from "next/server"

// Minimal AI moderation endpoint using OpenRouter (Gemini Flash 2.0)
// Env: OPENROUTER_API_KEY required

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type: "post" | "profile" | "event" | "community" | "comment" | "message"
      content: string
      locale?: string
      meta?: Record<string, unknown>
    }
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 })
    }

    const prompt = `You are an automated trust & safety classifier for an LGBTQ+ social app in ${
      body.locale || "pl-PL"
    }.
Classify the following ${body.type} content for policy violations.
Return strict JSON with fields: { decision: "allow"|"review"|"block", categories: string[], severity: "low"|"medium"|"high", reasons: string[], suggestions: string[] }.
Text:\n${body.content.slice(0, 4000)}`

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: "Respond ONLY with valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
      // Do not forward cookies; server-to-server only
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: "LLM error", detail: text }, { status: 502 })
    }
    const json = await res.json()
    const raw = json?.choices?.[0]?.message?.content
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "Invalid JSON from model", raw }, { status: 502 })
    }
    return NextResponse.json({ ok: true, result: parsed })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
