import { NextResponse } from "next/server"

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const FALLBACK_QUESTIONS_PL = [
  "Jakie wydarzenia LGBTQ w Twoim mieście polecasz w tym miesiącu?",
  "Co najbardziej wspierało Cię w coming outcie w Polsce?",
  "Jakie miejsca w Twojej okolicy są najbardziej przyjazne osobom LGBTQ?",
  "Jak możemy lepiej wspierać młode osoby queer w szkołach?",
  "Który polski aktywizm LGBTQ ostatnio Cię zainspirował i dlaczego?",
  "Jakie masz doświadczenia z PrEP/PEP i dostępnością w Polsce?",
  "Co zmieniłbyś/zmieniłabyś w politykach lokalnych na rzecz równości?",
  "Jak dbasz o zdrowie psychiczne w queerowej codzienności?",
]

export async function POST() {
  const key = process.env.OPENROUTER_API_KEY
  // If no key, return a random local prompt
  if (!key) {
    return NextResponse.json({ question: pickRandom(FALLBACK_QUESTIONS_PL) })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        // Optional but recommended by OpenRouter
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://tecza.app",
        "X-Title": "Tęcza.app Community Question",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content:
              "Jesteś kreatorem krótkich, wspierających i inkluzywnych pytań społecznościowych po polsku.",
          },
          {
            role: "user",
            content:
              "Wygeneruj jedno krótkie pytanie do polskiej społeczności LGBTQ. Maks. 140 znaków. Bez formatowania, emoji i numeracji.",
          },
        ],
        temperature: 0.7,
        max_tokens: 64,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json(
        { question: pickRandom(FALLBACK_QUESTIONS_PL) },
        { status: 200 },
      )
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content?.trim()
    const question =
      content && content.length > 0
        ? content
        : pickRandom(FALLBACK_QUESTIONS_PL)
    return NextResponse.json({ question })
  } catch {
    return NextResponse.json({ question: pickRandom(FALLBACK_QUESTIONS_PL) })
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
